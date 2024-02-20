import { remarkCodeHike } from "@code-hike/mdx";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import fs from "fs/promises"; // Import fs to read MDX file
import path from "path"; // Import path to resolve file paths

export default async function filepathToMdx(filePath: string): Promise<MDXRemoteSerializeResult> {
    const fileContents = await fs.readFile(filePath);

    const { serialize } = await import("next-mdx-remote/serialize");

    return await serialize(fileContents, {
        mdxOptions: {
            remarkPlugins: [
                [
                    remarkCodeHike,
                    {
                        autoImport: false,
                        lineNumbers: true,
                    },
                ],
            ],
            useDynamicImport: true,
        },
        parseFrontmatter: true,
    });
}
