import Document from "next/document";
import {Html, Head, Main, NextScript} from 'next/document'
import React from "react";

export default class MyDocument extends Document {
    render() {
        return (
            <Html lang={"en"}>
                <Head>
                <link rel="icon" href="../../fg-logo.svg" sizes="50x50" />
                    <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap"
                          rel="stylesheet"/>
                </Head>
                <body className={"bg-[--md-sys-color-surface]"}>
                <Main/>
                <NextScript/>
                </body>
            </Html>
        )
    }
}