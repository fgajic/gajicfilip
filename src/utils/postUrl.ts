import {Post, PostSearchModel, PostType} from "@/domain/post";

function generateBasePostUrl(postType: PostType) {
    switch (postType) {
        case PostType.Blog:
            return "/blog/";
        case PostType.Guide:
            return "/guides/";
        case PostType.Lab:
            return "/labs/";
        case PostType.Homework:
            return "/homeworks/";
        default:
            return "";
    }
}

export function generatePostSubUrl(post: PostSearchModel) {
    return generateBasePostUrl(post.type) + post.id;
}