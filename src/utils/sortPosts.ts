import { PostSearchModel } from "@/domain/post";

export function sortPostsByDate(posts: PostSearchModel[], ascending: boolean = false): PostSearchModel[] {
    return [...posts].sort((a, b) => {
        const dateA = new Date(a.info.stringDate.replace('.', ''));
        const dateB = new Date(b.info.stringDate.replace('.', ''));
        return ascending 
            ? dateA.getTime() - dateB.getTime() 
            : dateB.getTime() - dateA.getTime();
    });
} 