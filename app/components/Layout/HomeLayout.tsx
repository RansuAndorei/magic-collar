"use client";

import { SettingsEnum } from "@/utils/types";
import { usePathname } from "next/navigation";
import Footer from "./Footer/Footer";
import Header from "./Header/Header";

type Props = {
  children?: React.ReactNode;
  socials: Record<SettingsEnum, string | null> | null;
};

const HomeLayout = ({ children, socials }: Props) => {
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith("/admin");

  return (
    <>
      <Header />
      {children}
      {!isAdminPath && <Footer socials={socials} />}
    </>
  );
};

export default HomeLayout;
