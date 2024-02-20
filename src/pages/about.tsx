import React from 'react';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import fs from 'fs/promises'; // Import fs to read MDX file
import path from 'path'; // Import path to resolve file paths
import BlogImage from "@/components/BlogImage";
import { CH } from '@code-hike/mdx/components';

// Define component types
type ComponentProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

// Define components
const components: { [key: string]: React.FC<ComponentProps> } = {
  CH,
  h1: (props) => (
      <h1 className={"post-h1"} {...props} />
  ),
  h2: (props) => (
      <h2 className={"post-h2 on-surface-text secondary-text mt-8"} {...props} />
  ),
  h3: (props) => (
      <h3 className={"post-h3 on-surface-text secondary-text mt-8"} {...props} />
  ),
  p: (props) => (
      <p className={"post-p on-surface-text mt-2"} {...props} />
  ),
  a: (props) => (
      <a className={"post-p on-surface-text mt-2 primary-text hover:underline"} {...props} />
  ),
  ol: (props) => (
      <ol className={"post-p on-surface-text mt-2 list-decimal list-inside"} {...props}></ol>
  ),
  ul: (props) => (
      <ul className={"post-p on-surface-text mt-2 list-disc list-inside"} {...props}></ul>
  ),
  li: (props) => (
      <li className={"pt-2"} {...props}></li>
  ),
  BlogImage: (props: { src: string, sub: string, alt: string, width: number, height: number }) => (
      <BlogImage src={props.src} sub={props.sub} alt={props.alt} width={props.width} height={props.height}/>
  ),
  code: (props) => (
      <code className={"code"} {...props} />
  )
}

// Function to read MDX file
const readMDXFile = async (filePath: string) => {
  const fullPath = path.resolve(process.cwd(), filePath);
  const mdxContent = await fs.readFile(fullPath, 'utf8');
  const mdxSource = await serialize(mdxContent);
  return mdxSource;
};

// About component
const About: React.FC<{ mdxSource: any }> = ({ mdxSource }) => {
  return (
    <div className="container mx-auto px-4">
      <MDXRemote  {...mdxSource} components={components}/>
    </div>
  );
};

// Fetch MDX content and pass it to About component
export const getStaticProps = async () => {
  const mdxSource = await readMDXFile('./src/pages/about_me.mdx');
  return {
    props: {
      mdxSource,
    },
  };
};

export default About;
