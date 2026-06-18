import { FacebookIcon } from "@/public/icons/FacebookIcon";
import { GoogleIcon } from "@/public/icons/GoogleIcon";
import { isAppError } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { Button, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Provider } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { insertError } from "../actions";
import { signInWithOAuth } from "../sign-in/actions";

const OAuth = () => {
  const pathname = usePathname();

  const handleSignin = async (provider: Provider) => {
    try {
      await signInWithOAuth(supabaseClient, { provider });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isAppError(e)) {
        await insertError(supabaseClient, {
          errorTableInsert: {
            error_message: e.message,
            error_url: pathname,
            error_function: "handleSignin",
          },
        });
      }
    }
  };

  return (
    <Stack gap="sm">
      <Button
        size="md"
        fullWidth
        leftSection={<GoogleIcon />}
        variant="outline"
        color="gray"
        fz={14}
        onClick={() => {
          handleSignin("google");
        }}
      >
        Continue with Google
      </Button>
      <Button
        size="md"
        fullWidth
        leftSection={<FacebookIcon />}
        variant="outline"
        color="blue"
        fz={14}
        onClick={() => {
          handleSignin("facebook");
        }}
      >
        Continue with Facebook
      </Button>
    </Stack>
  );
};

export default OAuth;
