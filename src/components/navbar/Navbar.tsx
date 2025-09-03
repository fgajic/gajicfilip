// Navbar.tsx

import NavbarLightSwitch from "@/components/navbar/NavbarLightSwitch";
import Divider from "@/components/Divider";
import React, { useState } from "react";
import { maxWidthClass } from "@/utils/styling";
import NavbarLink from "@/components/navbar/NavbarLink";
import NavbarHome from "@/components/navbar/NavbarHome";
import { AuthorInfo } from "@/domain/author";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <div className={"h-14"} />
      <div className={`fixed top-0 w-full bg-[--md-sys-color-surface] z-50 pt-2 ${maxWidthClass}`}>

        {/* Mobile */}
        <div className={"sm:hidden mx-2 mb-2"}>
          <div className={"flex"}>
            <NavbarHome />
            <button className={"ml-auto rounded"} onClick={toggleMobileMenu}>
              <svg
                className={"fill-[--md-sys-color-on-surface]"}
                xmlns="http://www.w3.org/2000/svg"
                height="32"
                viewBox="0 0 24 24"
                width="32"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M4 18h16c.552 0 1-.448 1-1s-.448-1-1-1H4c-.552 0-1 .448-1 1s.448 1 1 1zm0-5h16c.552 0 1-.448 1-1s-.448-1-1-1H4c-.552 0-1 .448-1 1s.448 1 1 1zM3 7c0 .552.448 1 1 1h16c.552 0 1-.448 1-1s-.448-1-1-1H4c-.552 0-1 .448-1 1z" />
              </svg>
            </button>
          </div>
          {mobileMenuOpen && (
            <div className={"flex"}>
              <div className={"flex-col space-y-4 mt-4 ml-10"}>
                <NavbarContent isMobile={true} onClick={toggleMobileMenu} />
              </div>
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className={"max-sm:hidden mx-2 mb-2 flex flex-row items-center gap-2"}>
          <NavbarHome />
          <NavbarContent isMobile={false} onClick={() => { }} />
        </div>

        <Divider className={"on-surface-text"} />
      </div>
    </>
  );
}

type LinkClickedCallback = () => void;
type NavbarContentProps = {
  isMobile: boolean;
  onClick: LinkClickedCallback;
};

function NavbarContent({ isMobile, onClick }: NavbarContentProps) {
  let textClass = "on-surface-text ";
  textClass += isMobile ? "title-large" : "title-medium";

  return (
    <>
      <NavbarLink href={"/blog"} onClick={onClick}><p className={textClass}>Blog</p></NavbarLink>
      <NavbarLink href={"/labs"} onClick={onClick}><p className={textClass}>Labs</p></NavbarLink>
      <NavbarLink href={"/guides"} onClick={onClick}><p className={textClass}>Guides</p></NavbarLink>
      <NavbarLink href={"/about"} onClick={onClick}><p className={textClass}>About</p></NavbarLink>
      <div className={"flex items-center ml-auto"}>
        <NavbarLink href={AuthorInfo.linkedInUrl} openNewWindow>
          <svg className={"fill-[--md-sys-color-on-surface]"} xmlns="http://www.w3.org/2000/svg" width="24" height="24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </NavbarLink>
        <NavbarLink href={AuthorInfo.instagramUrl} openNewWindow>
          <svg className={"fill-[--md-sys-color-on-surface]"} width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M7 2h10c2.761 0 5 2.239 5 5v10c0 2.761-2.239 5-5 5H7c-2.761 0-5-2.239-5-5V7c0-2.761 2.239-5 5-5zm0 2C5.346 4 4 5.346 4 7v10c0 1.654 1.346 3 3 3h10c1.654 0 3-1.346 3-3V7c0-1.654-1.346-3-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM18 6.5a1.5 1.5 0 1 1-3.001.001A1.5 1.5 0 0 1 18 6.5z"/>
          </svg>
        </NavbarLink>
        <NavbarLink href={AuthorInfo.mediumUrl} openNewWindow>
          <svg className={"fill-[--md-sys-color-on-surface]"} width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </NavbarLink>
        <div className={"ml-0 p-0 h-4 border-l border-solid border-[--md-sys-color-outline-variant]"} />
        <NavbarLightSwitch />
      </div>
    </>
  );
}
