"use client";

import { CarShopType, SettingsEnum } from "@/utils/types";
import { Box } from "@mantine/core";
import { useEffect } from "react";
import CarBrands from "./Sections/CarBrands";
import Contact from "./Sections/Contact";
import CTABanner from "./Sections/CTABanner";
import FeaturedProducts from "./Sections/FeaturedProducts";
import Hero from "./Sections/Hero";
import Testimonials from "./Sections/Testimonials";
import TrustBar from "./Sections/TrustBar";
import WhyUs from "./Sections/WhyUs";

type Props = {
  topItems: CarShopType[];
  socials: Record<SettingsEnum, string | null>;
};

const HomePage = ({ topItems, socials }: Props) => {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const element = document.getElementById(hash.slice(1));
      if (!element) return;
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }, 500);
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return (
    <Box style={{ minHeight: "100vh" }}>
      <Hero topItem={topItems[0]} />
      <TrustBar />
      <CarBrands />
      <FeaturedProducts topItems={topItems.slice(1)} />
      <WhyUs />
      <Testimonials />
      <CTABanner />
      <Contact socials={socials} />
    </Box>
  );
};

export default HomePage;
