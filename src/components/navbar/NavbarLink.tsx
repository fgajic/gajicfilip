import React, { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type LinkClickedCallback = () => void;

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: LinkClickedCallback;
  openNewWindow?: boolean; // New prop added to indicate if link should open in a new window
}

export default function NavbarLink({ children, onClick, href, openNewWindow }: Props) {
  const route = useRouter();
  const isActive = route.asPath.startsWith(href ?? "");

  const linkProps: any = {
    className: `
      py-2 px-3 rounded-3xl w-fit block hover:bg-[--md-sys-color-secondary-container] 
      ${isActive ? "underline underline-offset-4" : ""}
    `,
    onClick: onClick,
    href: href ?? "",
  };

  // Check if the link should open in a new window
  if (openNewWindow) {
    linkProps.target = "_blank";
    linkProps.rel = "noopener noreferrer";
  }

  return (
    <Link {...linkProps}>
      {children}
    </Link>
  );
}
