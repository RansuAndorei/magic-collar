"use client";

import { useComputedColorScheme } from "@mantine/core";
import Link from "next/link";

type Props = {
  label: string;
  link: string;
};

const FooterLink = ({ label, link }: Props) => {
  const computed = useComputedColorScheme("dark");
  const defaultColor =
    computed === "dark" ? "var(--mantine-color-dark-3)" : "var(--mantine-color-gray-6)";

  return (
    <Link
      href={link}
      style={{
        fontSize: "var(--mantine-font-size-sm)",
        textDecoration: "none",
        color: defaultColor,
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--mantine-color-red-5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = defaultColor;
      }}
    >
      {label}
    </Link>
  );
};

export default FooterLink;
