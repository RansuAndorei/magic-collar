import { ReactNode } from "react";
import AdminLayout from "./components/AdminLayout";

type Props = {
  children: ReactNode;
};

const Layout = ({ children }: Props) => {
  return <AdminLayout>{children}</AdminLayout>;
};

export default Layout;
