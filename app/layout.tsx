import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import "mantine-datatable/styles.css";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "./global.css";

import { LOGO_PATH } from "@/utils/constants";
import { isAppError } from "@/utils/functions";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { SettingsEnum } from "@/utils/types";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { ReactNode } from "react";
import { fetchSocials, insertError } from "./actions";
import HomeLayout from "./components/Layout/HomeLayout";
import LoadingOverlay from "./components/LoadingOverlay";
import { Providers } from "./providers";

export const metadata = {
  title: "Magic Collar | Fit & Firm",
  description:
    "Shop genuine Magic Collar performance parts for Honda, Toyota, Mitsubishi, Ford, BMW, and 13 more car brands. Available for retail buyers and accredited resellers nationwide. Fast delivery across the Philippines.",
};

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const Layout = async ({ children }: { children: ReactNode }) => {
  const supabaseClient = await createSupabaseServerClient();
  let socials: Record<SettingsEnum, string | null> | null = null;
  try {
    const socialsData = await fetchSocials(supabaseClient, {
      socials: ["FACEBOOK", "INSTAGRAM", "YOUTUBE", "TIKTOK"],
    });
    socials = socialsData;
  } catch (e) {
    if (isAppError(e)) {
      await insertError(supabaseClient, {
        errorTableInsert: {
          error_message: e.message,
          error_url: "/",
          error_function: "fetchLayoutInitialData",
        },
      });
    }
  }

  return (
    <html
      {...mantineHtmlProps}
      lang="en"
      className={`${barlowCondensed.variable} ${dmSans.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="shortcut icon" href={LOGO_PATH} />
      </head>
      <body>
        <Providers>
          <LoadingOverlay />
          <HomeLayout socials={socials}>{children}</HomeLayout>
        </Providers>
      </body>
    </html>
  );
};

export default Layout;
