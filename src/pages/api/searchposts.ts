import {NextApiRequest, NextApiResponse} from "next";
import Fuse from "fuse.js";
import {PostInfo, PostSearchModel, PostType} from "@/domain/post";
import blogPostsData from "../../posts/blog-posts-data.json";
import guidePostsData from "../../posts/guides-post-data.json"
import labPostsData from "../../posts/labs-posts-data.json"
import homeworkPostsData from "../../posts/homeworks-posts-data.json"
import FuseResult = Fuse.FuseResult;

export type SearchResponse = {
    hits: number;
    results: PostSearchModel[]
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<SearchResponse>
) {
    const postType = req.query['postType'] as unknown as PostType || PostType.Blog;
    const query: string = req.query['query']?.toString() || '';

    const posts = await PostSearcher.search(query, postType);

    res.status(200).json({hits: posts.length, results: posts})
}

interface Article {
    fontMatter: {
        title: string;
        teaser: string;
        date: string;
    };
    id: string;
}

export class PostSearcher {
    private static blogFuse: Fuse<PostSearchModel>;
    private static blogPosts: PostSearchModel[];

    private static guideFuse: Fuse<PostSearchModel>;
    private static guidePosts: PostSearchModel[]

    private static labFuse: Fuse<PostSearchModel>;
    private static labPosts: PostSearchModel[]

    private static homeworkFuse: Fuse<PostSearchModel>;
    private static homeworkPosts: PostSearchModel[]

    static async search(query: string, postType: PostType): Promise<PostSearchModel[]> {
        if (this.blogFuse == undefined || this.guideFuse == undefined) {
            await this.cacheArticles();
        }

        if (query === "") {
            if (postType == PostType.Blog) {
                return this.blogPosts;
            } else if (postType == PostType.Guide) {
                return this.guidePosts;
            } else if (postType == PostType.Lab) {
                return this.labPosts;
            } else if (postType == PostType.Homework) {
                return this.homeworkPosts;
            }
        }

        let result: FuseResult<PostSearchModel>[] = [];
        if (postType == PostType.Blog) {
            result = this.blogFuse.search(query);
        } else if (postType == PostType.Guide) {
            result = this.guideFuse.search(query);
        } else if (postType == PostType.Lab) {
            result = this.labFuse.search(query);
        } else if (postType == PostType.Homework) {
            result = this.homeworkFuse.search(query);
        }

        return result.map(e => e.item);
    }

    private static async cacheArticles() {
        this.blogPosts = this.generateSearchModels(blogPostsData as Article[], PostType.Blog);
        this.blogFuse = new Fuse(
            this.blogPosts,
            {
                threshold: 0.4,
                keys: ['info.title']
            }
        );

        this.guidePosts = this.generateSearchModels(guidePostsData as Article[], PostType.Guide);
        this.guideFuse = new Fuse(
            this.guidePosts,
            {
                threshold: 0.4,
                keys: ['info.title']
            }
        );

        this.labPosts = this.generateSearchModels(labPostsData as Article[], PostType.Lab);
        this.labFuse = new Fuse(
            this.labPosts,
            {
                threshold: 0.4,
                keys: ['info.title']
            }
        );

        this.homeworkPosts = this.generateSearchModels(homeworkPostsData as Article[], PostType.Homework);
        this.homeworkFuse = new Fuse(
            this.homeworkPosts,
            {
                threshold: 0.4,
                keys: ['info.title']
            }
        );
    }

    private static generateSearchModels(articles: Article[], postType: PostType): PostSearchModel[] {
        return articles
            .filter(e => e?.fontMatter && e.fontMatter.title && e.fontMatter.date && e.fontMatter.teaser)
            .map(e => {
                const postInfo = {
                    title: e.fontMatter.title,
                    stringDate: e.fontMatter.date,
                    teaser: e.fontMatter.teaser
                } as PostInfo

                return {info: postInfo, id: e.id, type: postType} as PostSearchModel;
            }).sort((a, b) => {
            // Newest first sort.
            const dateA = new Date(a.info.stringDate);
            const dateB = new Date(b.info.stringDate);

            return dateB.getTime() - dateA.getTime();
        });
    }
}