import {PostType} from "@/domain/post";

export function getPostDir(postType: PostType): string {
    switch (postType) {
        case PostType.Blog:
            return blogDir;
        case PostType.Guide:
            return guidesDir;
        case PostType.Lab:
            return labsDir;
        case PostType.Homework:
            return homeworksDir;
        default:
            return "";
    }
}

export const postsDir = "./src/posts/";
export const blogDir = `${postsDir}blog/`;
export const guidesDir = `${postsDir}guides/`;
export const labsDir = `${postsDir}labs/`;
export const homeworksDir = `${postsDir}homeworks/`;