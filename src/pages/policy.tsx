import { CH } from "@code-hike/mdx/components";
import React from "react";
import Divider from "@/components/Divider";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from 'next-mdx-remote/serialize';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BlogImage from "@/components/BlogImage";

interface AboutPageProps {
  content: any; // Adjust the type as per your MDX content structure
}

const components = {
    CH,
    h1: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) => (
        <h1 className={"post-h1"} {...props} />
    ),
    h2: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) => (
        <h2 className={"post-h2 on-surface-text secondary-text mt-8"} {...props} />
    ),
    h3: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) => (
        <h3 className={"post-h3 on-surface-text secondary-text mt-8"} {...props} />
    ),
    p: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>) => (
        <p className={"post-p on-surface-text mt-2"} {...props} />
    ),
    a: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => (
        <a className={"post-p on-surface-text mt-2 primary-text hover:underline"} {...props} />
    ),
    ol: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLOListElement>, HTMLOListElement>) => (
        <ol className={"post-p on-surface-text mt-2 list-decimal list-inside"} {...props}></ol>
    ),
    ul: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>) => (
        <ul className={"post-p on-surface-text mt-2 list-disc list-inside"} {...props}></ul>
    ),
    li: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLLIElement>, HTMLLIElement>) => (
        <li className={"pt-2"} {...props}></li>
    ),
    code: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => (
        <code className={"code"} {...props} />
    )
}

const AboutPage: React.FC<AboutPageProps> = ({ content }) => {
  return (
      <div className={"mt-4 flex w-full align-middle justify-center"}>
          <div className={"min-w-full"}>
              <MDXRemote {...content} components={components}/>
          </div>
      </div>
  );
};

export async function getStaticProps() {
  const aboutMeFilePath = path.join(process.cwd(),'./src/pages/privacy_policy.mdx'); // Adjust the path as per your file structure
  const fileContents = fs.readFileSync(aboutMeFilePath, 'utf8');
  const { content, data } = matter(fileContents);
  const mdxSource = await serialize(content);

  return {
      props: {
          content: mdxSource,
      },
  };
}

export default AboutPage;
