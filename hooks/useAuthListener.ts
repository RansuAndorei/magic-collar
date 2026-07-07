"use client";

import { fetchUserProfile, insertError } from "@/app/actions";
import { useUserActions } from "@/stores/useUserStore";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function useAuthListener() {
  const { setUserData, setUserProfile, setIsLoading, reset, setHasInitialized } = useUserActions();
  const mounted = useRef(true);
  const pathname = usePathname();
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    mounted.current = true;

    const handleFetchUserData = async (user: User) => {
      try {
        const profile = await fetchUserProfile(supabaseClient, { userId: user.id });
        if (mounted.current) {
          setUserProfile(profile);
        }
      } catch (e) {
        if (isAppError(e)) {
          await insertError(supabaseClient, {
            errorTableInsert: {
              error_message: e.message,
              error_url: pathname,
              error_function: "handleFetchUserData",
              error_user_email: user.email,
              error_user_id: user.id,
            },
          });
        }
        return null;
      }
    };

    const init = async () => {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes("sign-in") || currentPath.includes("sign-up");

      if (!isAuthPage) setIsLoading(true);

      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        const user = data.session?.user ?? null;

        if (!mounted.current) return;

        if (user) {
          setUserData(user);
          currentUserIdRef.current = user.id;
          await handleFetchUserData(user);
        } else {
          reset();
          currentUserIdRef.current = null;
        }
      } catch (e) {
        if (isAppError(e)) {
          await insertError(supabaseClient, {
            errorTableInsert: {
              error_message: e.message,
              error_url: pathname,
              error_function: "init",
            },
          });
        }
        if (mounted.current) reset();
      } finally {
        if (mounted.current && !isAuthPage) {
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };

    init();

    const shouldShowLoading = (event: string) => event === "SIGNED_IN" || event === "SIGNED_OUT";

    const { data: subscription } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes("sign-in") || currentPath.includes("sign-up");

      const shouldIgnore =
        (event === "SIGNED_IN" && user?.id === currentUserIdRef.current) ||
        event === "TOKEN_REFRESHED";

      if (mounted.current && !isAuthPage && shouldShowLoading(event)) {
        setIsLoading(true);
      }

      try {
        if (!shouldIgnore) {
          if (user) {
            setUserData(user);
            currentUserIdRef.current = user.id;

            handleFetchUserData(user);
          } else {
            reset();
            currentUserIdRef.current = null;
          }
        }
      } catch (e) {
        if (isAppError(e)) {
          await insertError(supabaseClient, {
            errorTableInsert: {
              error_message: e.message,
              error_url: pathname,
              error_function: "onAuthStateChange",
              error_user_email: user?.email,
              error_user_id: user?.id,
            },
          });
        }
        if (mounted.current) reset();
      } finally {
        if (mounted.current && !isAuthPage && shouldShowLoading(event)) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted.current = false;
      subscription.subscription.unsubscribe();
    };
  }, [setUserData, setUserProfile, reset, setIsLoading, pathname]);
}
