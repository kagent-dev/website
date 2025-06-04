const fs = require('fs');
const path = require('path');
const getToolCategoryId = require('../src/lib/getToolCategoryId');

const pagesDir = path.resolve(__dirname, '../src/app');
const publicDir = path.resolve(__dirname, '../public');
const siteUrl = 'https://kagent.dev'; 
const excludedFiles = ['layout.tsx', 'loading.tsx', 'error.tsx', 'template.tsx', 'opengraph-image.tsx', 'opengraph-image.png', 'icon.tsx', 'sitemap.ts', 'robots.ts', 'not-found.tsx', 'global-error.tsx', 'globals.css'];
const pageExtensions = ['.tsx', '.mdx','.js'];

const DYNAMIC_PATTERNS_TO_EXCLUDE = [
    { prefix: 'blog/', placeholder: '[slug]' },
    { prefix: 'tools/', placeholder: '[categoryId]' },
    { prefix: 'agents/', placeholder: '[agentId]' }
];

function findPages(dir, excludedDynamicPatterns, pages = []) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            findPages(fullPath, excludedDynamicPatterns, pages);
        } else if (item.isFile()) {
            const ext = path.extname(item.name);
            const baseName = path.basename(item.name);
            const secondExt = path.extname(path.basename(item.name, ext));

            if (
                (baseName.startsWith('page') && pageExtensions.includes(ext)) ||
                (baseName.startsWith('route') && pageExtensions.includes(ext) && secondExt === '')
            ) {
                if (!excludedFiles.includes(baseName) && !excludedFiles.some(excluded => item.name.endsWith(excluded))) {
                     // Convert file path to URL path
                    let relativePath = path.relative(pagesDir, fullPath);

                    if (relativePath.endsWith('/page.tsx')) {
                        relativePath = relativePath.substring(0, relativePath.length - '/page.tsx'.length);
                    } else if (relativePath.endsWith('/page.js')) {
                        relativePath = relativePath.substring(0, relativePath.length - '/page.js'.length);
                    } else if (relativePath.endsWith('/route.ts')) {
                        relativePath = relativePath.substring(0, relativePath.length - '/route.ts'.length);
                    } else if (relativePath.endsWith('/route.js')) {
                        relativePath = relativePath.substring(0, relativePath.length - '/route.js'.length);
                    } else if (relativePath.endsWith('/page.mdx')) {
                        relativePath = relativePath.substring(0, relativePath.length - '/page.mdx'.length);
                    }

                    // Check if the page matches any of the dynamic patterns to exclude
                    let excludePage = false;
                    for (const pattern of excludedDynamicPatterns) {
                        if (relativePath.startsWith(pattern.prefix) && relativePath.includes(pattern.placeholder)) {
                            excludePage = true;
                            break;
                        }
                    }
                    if (excludePage) {
                        continue;
                    }
                    if (!relativePath.includes('(api)') && !relativePath.includes('/api/')) {
                        // Handle index routes (page.tsx at the root of a directory)
                        if (relativePath === '') {
                            pages.push('/');
                        } else {
                            pages.push(`/${relativePath}`);
                        }
                    }
                }
            }
        }
    }
    return pages;
}

async function getDynamicRoutes() {
    let dynamicUrls = [];

    try {
        const agentDataPath = path.resolve(__dirname, '../src/data/agents.json');
        const agentDataString = fs.readFileSync(agentDataPath, 'utf-8');
        const agents = JSON.parse(agentDataString);
        if (Array.isArray(agents)) {
            const agentUrls = agents.map(agent => `/agents/${agent.name}`);
            dynamicUrls = dynamicUrls.concat(agentUrls);
        } else {
            console.warn("Could not load dynamic agent routes: agents.json is not an array or is empty.");
        }
    } catch (error) {
        console.warn(`Error loading agent routes from JSON: ${error.message}`);
    }

    try {
        const toolDataPath = path.resolve(__dirname, '../src/data/tools.json');
        const toolDataString = fs.readFileSync(toolDataPath, 'utf-8');
        const tools = JSON.parse(toolDataString);
        if (Array.isArray(tools)) {
            const toolCategoryUrls = tools.map(tool => {
                const categoryId = getToolCategoryId(tool.provider);
                return `/tools/${categoryId}`;
            });
            dynamicUrls = dynamicUrls.concat(toolCategoryUrls);
        } else {
            console.warn("Could not load dynamic tool routes: tools.json is not an array or is empty.");
        }
    } catch (error) {
        console.warn(`Error loading tool routes from JSON: ${error.message}`);
    }

    return dynamicUrls;
}

function generateSitemap(pages) {
    const today = new Date().toISOString().split('T')[0];
    const sitemapContent = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(page => `
    <url>
        <loc>${siteUrl}${page}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    `).join('')}
</urlset>
    `.trim();

    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log(`Sitemap generated successfully at ${sitemapPath}`);
}

try {
    (async () => {
        let pageUrls = findPages(pagesDir, DYNAMIC_PATTERNS_TO_EXCLUDE);
        
        const dynamicUrls = await getDynamicRoutes();
        pageUrls = pageUrls.concat(dynamicUrls);

        const uniquePageUrls = [...new Set(pageUrls)];
        generateSitemap(uniquePageUrls);
    })();
} catch (error) {
    console.error("Error generating sitemap:", error);
} 