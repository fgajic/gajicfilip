import Head from 'next/head'
import {InferGetStaticPropsType} from "next";
import PostItem from "@/components/PostItem";
import {PostType} from "@/domain/post";
import {PostSearcher} from "@/pages/api/searchposts";
import {AuthorInfo} from "@/domain/author";

export default function Home({blogPosts, guidePosts}: InferGetStaticPropsType<typeof getStaticProps>) {
    return (
        <>
            <Head>
                <title>{AuthorInfo.fullName}</title>
            </Head>
            <main>
                <p className={"display-small on-surface-text mt-8"}>
                    {`I am Filip, a DevOps Engineer from Serbia who is passionate about exploring and experimenting with new technologies.`}<br/>
                    {`On this website, you will discover my blog posts and guidance articles primarily focused on SysOps and DevOps topics.`}
                </p>

                {
                    blogPosts.length > 0 &&
                    <>
                        <p className={"headline-medium primary-text mt-8"}>Latest blog posts</p>
                        <div className={"grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 mx-4"}>
                            {

                                blogPosts.map((post) => (
                                    <PostItem key={post.id} post={post}/>
                                ))
                            }
                        </div>
                    </>
                }

                {
                    guidePosts.length > 0 &&
                    <>
                        <p className={"headline-medium primary-text mt-8"}>Latest guides</p>
                        <div className={"grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 mx-4"}>
                            {
                                guidePosts.map((post) => (
                                    <PostItem key={post.id} post={post}/>
                                ))
                            }
                        </div>
                    </>
                }
            </main>
        </>
    )
}

export async function getStaticProps() {
    const blogPosts = await PostSearcher.search("", PostType.Blog);
    const guidePosts = await PostSearcher.search("", PostType.Guide);

    return {
        props: {
            blogPosts: blogPosts.slice(0, 2),
            guidePosts: guidePosts.slice(0, 2)
        }
    }
}