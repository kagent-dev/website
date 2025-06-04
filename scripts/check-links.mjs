#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const SOURCE_EXTENSIONS = ['.mdx', '.tsx'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.cache'];

const NAVIGATION_JSON_PATH = path.join(PROJECT_ROOT, 'src/config/navigation.json');
const DOCS_ROUTE_PREFIX = '/docs';
const ACTUAL_DOCS_FILESYSTEM_ROOT = path.join(PROJECT_ROOT, 'src/app/docs');

const IMAGES_ROUTE_PREFIX = '/images';
const ACTUAL_IMAGES_FILESYSTEM_ROOT = path.join(PROJECT_ROOT, 'public/images');

const DISK_TARGET_EXTENSIONS = ['.mdx', '.tsx', '.html'];
const DISK_INDEX_FILES = ['index.mdx', 'index.tsx', 'index.html', 'page.mdx', 'page.tsx', 'page.html'];

const MD_LINK_REGEX = /\[(?:[^\]]+)\]\(([^)\s]+)(?:\s[^)]*)?\)/g;
const HTML_A_HREF_REGEX = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;

async function fileExists(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.isFile();
    } catch (e) {
        return false;
    }
}

async function loadNavigationHrefs(filePath) {
    const navHrefs = new Set();
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const navItems = JSON.parse(content);
        function extractHrefsRecursive(items) {
            for (const item of items) {
                if (item.href && !item.external) {
                    navHrefs.add(item.href);
                }
                if (item.items && Array.isArray(item.items)) {
                    extractHrefsRecursive(item.items);
                }
            }
        }
        extractHrefsRecursive(navItems);
        console.log(`Loaded ${navHrefs.size} hrefs from ${path.relative(PROJECT_ROOT, filePath)}`);
    } catch (error) {
        console.warn(`Warning: Could not load or parse ${filePath}: ${error.message}`);
    }
    return navHrefs;
}

async function findFiles(dir, extensions) {
    let filesFound = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (IGNORE_DIRS.includes(entry.name)) continue;
            if (entry.isDirectory()) {
                filesFound = filesFound.concat(await findFiles(fullPath, extensions));
            } else if (extensions.includes(path.extname(entry.name))) {
                filesFound.push(fullPath);
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'EACCES') {
            console.warn(`Skipping directory ${dir}: ${error.message}`);
        } else {
            if (dir === ACTUAL_DOCS_FILESYSTEM_ROOT && error.code === 'ENOENT') {
                console.warn(`Docs directory ${ACTUAL_DOCS_FILESYSTEM_ROOT} not found. No files to check.`);
                return [];
            }
            throw error;
        }
    }
    return filesFound;
}

async function extractLinksFromFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const links = new Set();
    let match;
    if (filePath.endsWith('.mdx')) {
        while ((match = MD_LINK_REGEX.exec(content)) !== null) links.add(match[1]);
    }
    while ((match = HTML_A_HREF_REGEX.exec(content)) !== null) links.add(match[2]);
    return Array.from(links);
}

async function checkDocsFileSystem(basePath) {
    if (await fileExists(basePath)) {
        return true;
    }
    for (const ext of DISK_TARGET_EXTENSIONS) {
        if (await fileExists(basePath + ext)) {
            return true;
        }
    }
    for (const indexFile of DISK_INDEX_FILES) {
        if (await fileExists(path.join(basePath, indexFile))) {
            return true;
        }
    }
    return false;
}

async function checkInternalLink(link, sourceFileDir, navigationHrefs) {
    let normalizedLink = link.split(/[?#]/)[0];

    // 1. Check against navigation.json hrefs
    if (navigationHrefs.has(normalizedLink)) {
        return true;
    }

    // 2. Handle different types of links based on their prefix or structure
    if (normalizedLink.startsWith(IMAGES_ROUTE_PREFIX)) { // e.g. /images/foo.png
        const imagePath = normalizedLink.substring(IMAGES_ROUTE_PREFIX.length).replace(/^\/+/, '');
        const filePath = path.join(ACTUAL_IMAGES_FILESYSTEM_ROOT, imagePath);
        return await fileExists(filePath);
    } else if (normalizedLink.startsWith(DOCS_ROUTE_PREFIX)) { // e.g. /docs/topic/page
        const relativePathFromDocsRoute = normalizedLink.substring(DOCS_ROUTE_PREFIX.length).replace(/^\/+/, '');
        const baseForFileOps = path.join(ACTUAL_DOCS_FILESYSTEM_ROOT, relativePathFromDocsRoute);
        return await checkDocsFileSystem(baseForFileOps);
    } else if (normalizedLink.startsWith('/')) {
        // Ignore root links, e.g. /tools, /agents
        return true;
    } else { // Relative link, e.g. ./foo.mdx or ../bar/baz
        const baseForFileOps = path.resolve(sourceFileDir, normalizedLink);
        if (!baseForFileOps.startsWith(ACTUAL_DOCS_FILESYSTEM_ROOT)) {
            return false;
        }
        return await checkDocsFileSystem(baseForFileOps);
    }
}

async function main() {
    console.log('Starting link check.');
    const navigationHrefs = await loadNavigationHrefs(NAVIGATION_JSON_PATH);
    const filesToCheck = await findFiles(ACTUAL_DOCS_FILESYSTEM_ROOT, SOURCE_EXTENSIONS);
    const brokenLinks = [];
    let checkedLinksCount = 0;

    if (filesToCheck.length === 0 && !(await fs.stat(ACTUAL_DOCS_FILESYSTEM_ROOT).catch(() => null))) {
        process.exit(0);
    }
    console.log(`Found ${filesToCheck.length} files to check in ${path.relative(PROJECT_ROOT, ACTUAL_DOCS_FILESYSTEM_ROOT)}.`);

    for (const file of filesToCheck) {
        const relativeFilePath = path.relative(PROJECT_ROOT, file);
        const links = await extractLinksFromFile(file);
        if (links.length === 0) continue;

        const sourceFileDir = path.dirname(file);

        for (const link of links) {
            checkedLinksCount++;
            if (!link || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#') || link.startsWith('data:')) {
                continue;
            }
            if (link.startsWith('http://') || link.startsWith('https://')) {
                continue;
            }

            const isValid = await checkInternalLink(link, sourceFileDir, navigationHrefs);

            if (!isValid) {
                brokenLinks.push({ file: relativeFilePath, link });
                console.error(`BROKEN: ${relativeFilePath} -> ${link}`);
            }
        }
    }

    console.log(`\nChecked ${checkedLinksCount} links in ${filesToCheck.length} files.`);
    if (brokenLinks.length > 0) {
        console.error(`\nFound ${brokenLinks.length} broken links:`);
        brokenLinks.forEach(item => console.error(`- In "${item.file}": link to "${item.link}" is broken.`));
        process.exit(1);
    } else {
        console.log('\nNo broken links found in docs! 🎉');
        process.exit(0);
    }
}

main().catch(err => {
    console.error("Error during link checking:", err);
    process.exit(1);
}); 