import { insertError } from "@/app/actions";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { OptionType } from "@/utils/types";
import { redirect } from "next/navigation";
import { getRegionList } from "./actions";
import OnboardingPage from "./components/OnboardingPage";

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
          error_url: "/",
          error_function: "fetchOnboardingInitialData",
        },
      });
    }
    redirect("/error/500");
  }

  return <OnboardingPage regionList={regionList} />;
};

export default Page;
