import PostsList from "@/components/PostsList";
import {PostType} from "@/domain/post";
import Head from "next/head";
import React from "react";
import {AuthorInfo} from "@/domain/author";

export default function Home() {
    return(
        <>
            <Head>
                <title>Labs | {AuthorInfo.fullName}</title>
            </Head>
            <main>
                <PostsList postType={PostType.Lab} showSearch={true}/>
            </main>
        </>
    )
}


