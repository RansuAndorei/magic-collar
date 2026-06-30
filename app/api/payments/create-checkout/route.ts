import { insertError } from "@/app/actions";
import {
  feeCalculator,
  formatCurrency,
  getProductSubtitle,
  getProductTitle,
  isAppError,
} from "@/utils/functions";
import { checkRateLimit } from "@/utils/rateLimit";
import { createSupabaseServiceRoleClient } from "@/utils/supabase/service-role";
import { CreateCheckoutReqType } from "@/utils/types";
import { NextResponse } from "next/server";
import { v4 } from "uuid";
import { createCheckout, getOrderItems } from "./actions";

export async function POST(req: Request) {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const pathname = new URL(req.url).pathname;

  let body: CreateCheckoutReqType;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const { paymentMethod, orderData, description, userId, userEmail } = body;
  const checkoutId = v4();

  const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
  if (!PAYMONGO_SECRET_KEY) {
    console.error("PAYMONGO_SECRET_KEY is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const supabaseClient = await createSupabaseServiceRoleClient();

  try {
    const orderItemIdList = [...new Set(orderData.items.map(({ id }) => id))];
    const fetchedItemList = await getOrderItems(supabaseClient, { orderItemIdList });

    let total = 0;
    const finalItemList = orderData.items
      .map((item) => {
        const foundItem = fetchedItemList.find((f) => f.car_id === item.id);
        if (!foundItem) return null;

        const {
          car_image_attachment,
          car_magic_collar,
          car_make,
          car_model,
          car_model_code,
          car_model_year_start,
          car_model_year_end,
        } = foundItem;

        total += foundItem.car_magic_collar.magic_collar_down_payment_price * item.quantity;

        return {
          name: getProductTitle(car_make.make, car_model.model),
          description: getProductSubtitle(car_model_code, car_model_year_start, car_model_year_end),
          quantity: item.quantity,
          amount: car_magic_collar.magic_collar_down_payment_price * 100,
          currency: car_magic_collar.magic_collar_price_currency,
          images: [car_image_attachment.attachment_path],
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (finalItemList.length === 0) {
      return NextResponse.json({ error: "No valid items found" }, { status: 400 });
    }

    const currencies = [...new Set(finalItemList.map((i) => i.currency))];
    if (currencies.length > 1) {
      return NextResponse.json({ error: "Mixed currencies in order" }, { status: 400 });
    }
    const currency = currencies[0];

    const { transferFee, totalAmount } = feeCalculator(total, paymentMethod);

    const paymongoRes = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              ...finalItemList,
              {
                name: "Processing Fee",
                description: `${paymentMethod.toUpperCase()} processing fee applied to the total amount of ${formatCurrency(total, { currency })}`,
                quantity: 1,
                amount: Math.round(transferFee * 100),
                currency,
                images: [`${process.env.NEXT_PUBLIC_SITE_URL}/images/payment/${paymentMethod}.jpg`],
              },
            ],
            payment_method_types: [paymentMethod.toLowerCase()],
            description,
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
            metadata: {
              paymentMethod,
              orderData: JSON.stringify(orderData),
              description,
              userId,
              userEmail,
              totalAmount,
              currency,
              checkoutId,
            },
          },
        },
      }),
    });

    const data = await paymongoRes.json();
    if (!paymongoRes.ok) {
      console.error("PayMongo error:", data);
      return NextResponse.json({ error: data }, { status: paymongoRes.status });
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    const paymentIntentId = data.data.attributes.payment_intent.id;
    const checkoutSessionId = data.data.id;

    await createCheckout(supabaseClient, {
      checkoutData: {
        checkout_id: checkoutId,
        checkout_url: checkoutUrl,
        checkout_intent_id: paymentIntentId,
        checkout_session_id: checkoutSessionId,
      },
    });

    return NextResponse.json({
      checkout_url: checkoutUrl,
      payment_intent_id: paymentIntentId,
      checkout_id: checkoutId,
    });
  } catch (e) {
    await insertError(supabaseClient, {
      errorTableInsert: {
        error_message: e instanceof Error ? e.message : "Unknown error",
        error_url: pathname,
        error_function: "create-checkout",
        error_user_email: userEmail,
        error_user_id: userId,
      },
    });

    const message = isAppError(e) ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
