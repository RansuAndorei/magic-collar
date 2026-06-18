import Footer from "./Footer/Footer";
import Header from "./Header/Header";

type Props = {
  children?: React.ReactNode;
};

const HomeLayout = async ({ children }: Props) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

export default HomeLayout;
