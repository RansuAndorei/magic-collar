import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import "mantine-datatable/styles.css";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "./global.css";

import { LOGO_PATH } from "@/utils/constants";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { ReactNode } from "react";
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
          <HomeLayout>{children}</HomeLayout>
        </Providers>
      </body>
    </html>
  );
};

export default Layout;
