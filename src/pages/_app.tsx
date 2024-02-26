import '@/styles/globals.css'
import "@code-hike/mdx/dist/index.css"
import "../styles/material/theme.css"
import type {AppProps} from 'next/app'
import {ThemeProvider} from "next-themes";
import Navbar from "@/components/navbar/Navbar";
import { maxWidthClass } from "@/utils/styling";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/react';
import Footer from "@/components/Footer";
import React from "react";

// Import About component
import About from "@/pages/about";

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider>
            <div className={`${maxWidthClass} m-auto flex flex-col min-h-screen`}>
                <Navbar/>
                <div className={"mx-4"}>
                    {Component === About ? (
                        <About {...pageProps} />
                    ) : (
                        <Component {...pageProps} />
                    )}
                </div>
                <SpeedInsights />
                <Analytics/>
                <Footer/>
            </div>
        </ThemeProvider>
    )
}
