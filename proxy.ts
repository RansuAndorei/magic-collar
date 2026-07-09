import { SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { insertError } from "./app/actions";
import { Database } from "./utils/database";
import { createSupabaseServerClient } from "./utils/supabase/server";

const LOGGED_OUT_ONLY_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"];

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
  ],
};

export default async function proxy(request: NextRequest) {
  const supabaseClient = await createSupabaseServerClient();
  const pathname = request.nextUrl.pathname;
  let user: User | null = null;

  try {
    const {
      data: { user: supabaseUser },
    } = await supabaseClient.auth.getUser();
    user = supabaseUser;
  } catch (e) {
    logMiddlewareError(supabaseClient, e, pathname, "proxy-fetch-user");
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }

  // Sign-in / sign-up / forgot-password are only for logged-out visitors.
  if (LOGGED_OUT_ONLY_ROUTES.includes(pathname)) {
    if (user) {
      try {
        const hasUserRow = await userRowExists(supabaseClient, user);
        if (!hasUserRow) return NextResponse.redirect(new URL("/user/onboarding", request.url));

        const isAdmin = await userIsAdmin(supabaseClient, user);
        if (isAdmin) return NextResponse.redirect(new URL("/admin/analytics", request.url));
      } catch (e) {
        console.log(e);
        logMiddlewareError(supabaseClient, e, pathname, "proxy-admin-redirect-check", user);
        return NextResponse.redirect(new URL("/error/500", request.url));
      }
      return NextResponse.redirect(new URL("/shop", request.url));
    }
    return NextResponse.next();
  }

  // Reset-password requires a logged in user, but no user_table/onboarding checks.
  if (pathname === "/reset-password") {
    if (!user) return NextResponse.redirect(new URL("/error/403", request.url));

    try {
      const hasUserRow = await userRowExists(supabaseClient, user);
      if (!hasUserRow) return NextResponse.redirect(new URL("/user/onboarding", request.url));
    } catch (e) {
      console.log(e);
      logMiddlewareError(supabaseClient, e, pathname, "proxy-reset-password-check", user);
      return NextResponse.redirect(new URL("/error/500", request.url));
    }

    return NextResponse.next();
  }

  // Every remaining matched route (/admin/*, /user/*) requires a logged in user.
  if (!user) return NextResponse.redirect(new URL("/error/403", request.url));

  try {
    const hasUserRow = await userRowExists(supabaseClient, user);

    if (pathname === "/user/onboarding") {
      if (hasUserRow) {
        const isAdmin = await userIsAdmin(supabaseClient, user);
        if (isAdmin) return NextResponse.redirect(new URL("/admin/analytics", request.url));
        return NextResponse.redirect(new URL("/shop", request.url));
      }
      return NextResponse.next();
    }

    // Make sure the logged in user has a row in user_table before proceeding.
    if (!hasUserRow) return NextResponse.redirect(new URL("/user/onboarding", request.url));

    if (pathname === "/admin") return NextResponse.next();
    if (pathname.startsWith("/admin")) return await handleAdminRoute(request, supabaseClient, user);

    return NextResponse.next();
  } catch (e) {
    console.log(e);
    logMiddlewareError(supabaseClient, e, pathname, "proxy-admin-check", user);
    return NextResponse.redirect(new URL("/error/500", request.url));
  }
}

const userRowExists = async (
  supabaseClient: SupabaseClient<Database>,
  user: User,
): Promise<boolean> => {
  const { data, error } = await supabaseClient
    .from("user_table")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
};

const userIsAdmin = async (
  supabaseClient: SupabaseClient<Database>,
  user: User,
): Promise<boolean> => {
  const { data, error } = await supabaseClient
    .from("user_table")
    .select("user_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data?.user_role === "ADMIN";
};

const handleAdminRoute = async (
  request: NextRequest,
  supabaseClient: SupabaseClient<Database>,
  user: User,
) => {
  const isAdmin = await userIsAdmin(supabaseClient, user);
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/error/403", request.url));
  }

  return NextResponse.next();
};

const logMiddlewareError = (
  supabaseClient: SupabaseClient<Database>,
  e: unknown,
  url: string,
  fnName: string,
  user?: User | null,
) => {
  if (isError(e)) {
    try {
      insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: url,
          error_function: fnName,
          error_user_email: user?.email,
          error_user_id: user?.id,
        },
      });
    } catch (e) {
      console.error("Failed to log middleware error", e);
    }
  }
};

const isError = (error: unknown): error is Error => {
  return (
    error instanceof Error || (typeof error === "object" && error !== null && "message" in error)
  );
};
