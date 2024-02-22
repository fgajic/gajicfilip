import Divider from "@/components/Divider";
import React, { useEffect } from "react";
import { maxWidthClass } from "@/utils/styling";
import { AuthorInfo } from "@/domain/author";
import CookieConsent from "react-cookie-consent";

export default function Footer() {
    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'UTF-8';
        script.src = '//cdn.cookie-script.com/s/48fe9c85535dd2497cff228183eed638.js';
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (
        <footer className={`mt-auto ${maxWidthClass}`}>
            <div className="mt-12">
                <Divider />
                <div className="flex min-h-full text-center h-14">
                    <div className="py-2 px-5 min-w-full flex flex-row items-center">
                        <p className="outline-text">© 2024 {AuthorInfo.fullName}. All rights reserved.</p>
                        <a id="csconsentlink" className="outline-text hover:underline cursor-pointer ml-auto">Cookies</a>
                    </div>
                </div>
            </div>
            <CookieConsent
                buttonText="I understand"
                buttonStyle={{ background: "#4e503b", color: "#fff", fontSize: "13px" }}
            >
                This website uses cookies to enhance the user experience.
            </CookieConsent>
        </footer>
    );
}
