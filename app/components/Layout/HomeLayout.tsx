"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer/Footer";
import Header from "./Header/Header";

type Props = {
  children?: React.ReactNode;
};

const HomeLayout = ({ children }: Props) => {
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith("/admin");

  return (
    <>
      <Header />
      {children}
      {!isAdminPath ? <Footer /> : null}
    </>
  );
};

export default HomeLayout;
