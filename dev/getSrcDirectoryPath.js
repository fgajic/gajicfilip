import path from "path";
import fs from "fs";

export const blogDir = path.join(postsDir(), "blog");
export const guidesDir = path.join(postsDir(), "guides");
export const labsDir = path.join(postsDir(), "labs");

export function postsDir() {
    return path.join(getSrcDirectoryPath(process.cwd()), "posts");
}

export function pagesDir() {
    return path.join(getSrcDirectoryPath(process.cwd()), "pages");
}

export function getSrcDirectoryPath(currentPath) {
    // Check if the current directory contains a "src" directory
    const srcPath = path.join(currentPath, 'src');
    if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
        return srcPath;
    }

    // If we reach the root directory, return null (src not found)
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
        return null;
    }

    // Recursively search in the parent directory
    return getSrcDirectoryPath(parentPath);
}
