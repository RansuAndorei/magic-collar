import { insertError } from "@/app/actions";
import { getRegionList } from "@/app/user/onboarding/actions";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { OptionType } from "@/utils/types";
import { redirect } from "next/navigation";
import UserProfileSettingsPage from "./components/UserProfileSettingsPage";

const Page = async () => {
  const supabaseClient = await createSupabaseServerClient();

  let regionList: OptionType[];
  try {
    regionList = await getRegionList(supabaseClient);
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: "/user/profile",
          error_function: "fetchProfileInitialData",
        },
      });
    }
    redirect("/error/500");
  }

  return <UserProfileSettingsPage regionList={regionList} />;
};

export default Page;
