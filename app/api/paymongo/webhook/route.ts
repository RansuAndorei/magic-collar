import { insertError } from "@/app/actions";
import { PAYMONGO_PAYMENT_DATA } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { checkRateLimit } from "@/utils/rateLimit";
import { createSupabaseServiceRoleClient } from "@/utils/supabase/service-role";
import { CreateCheckoutReqType, PaymongoWebhookPayload } from "@/utils/types";
import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { createOrder } from "./actions";

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET!;

const verifyPaymongoSignature = (rawBody: string, sigHeader: string) => {
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
  const timestamp = parts["t"];
  const signature = parts["li"] || parts["te"];

  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return expected === signature;
};

export async function POST(req: Request) {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const pathname = new URL(req.url).pathname;

  // Read raw body once — needed for signature verification and JSON parsing
  const rawBody = await req.text();

  // Verify webhook signature before doing anything else
  const sigHeader = req.headers.get("paymongo-signature") ?? "";

  if (!verifyPaymongoSignature(rawBody, sigHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaymongoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  try {
    const event = payload.data.attributes.type;

    if (event !== "payment.paid") {
      return new NextResponse("OK", { status: 200 });
    }

    const paymentId = payload.data.id;
    const attributes = payload.data.attributes.data.attributes;

    const {
      paymentMethod,
      orderData,
      description,
      userId,
      totalAmount,
      currency,
      checkoutId,
    }: CreateCheckoutReqType & {
      orderData: string;
      totalAmount: number;
      currency: string;
      checkoutId: string;
    } = attributes.metadata;

    let parsedOrderData: CreateCheckoutReqType["orderData"];
    try {
      parsedOrderData = JSON.parse(orderData);
    } catch {
      return NextResponse.json({ error: "Invalid orderData in metadata" }, { status: 400 });
    }

    const totalQuantity = parsedOrderData.items.reduce((total, item) => total + item.quantity, 0);

    const supabaseClient = await createSupabaseServiceRoleClient();
    await createOrder(supabaseClient, {
      orderData: parsedOrderData,
      totalQuantity,
      userId,
      paymentFeePercentage: PAYMONGO_PAYMENT_DATA[paymentMethod].fee,
      paymentData: {
        payment_external_id: paymentId,
        payment_status: "PAID",
        payment_amount: Number(totalAmount),
        payment_currency: currency,
        payment_method: paymentMethod,
        payment_description: description,
        payment_checkout_id: checkoutId,
      },
    });

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    const supabaseClient = await createSupabaseServiceRoleClient();
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: pathname,
          error_function: "POST",
        },
      });
      return NextResponse.json({ error: e.message }, { status: 500 });
    }

    await insertError(supabaseClient, {
      errorTableInsert: {
        error_message: e instanceof Error ? e.message : "Unknown error",
        error_url: pathname,
        error_function: "POST",
      },
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
