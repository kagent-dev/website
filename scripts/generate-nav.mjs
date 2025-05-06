import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Helper function to convert kebab-case to Title Case
const kebabToTitleCase = (str) => {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const DOCS_BASE_PATH = path.join(process.cwd(), 'src/app/docs');
const OUTPUT_NAV_PATH = path.join(process.cwd(), 'src/config/navigation.json');
const EXCLUDED_DIRS_FILES = new Set(['components', 'lib', 'api', 'page.tsx', 'layout.tsx', 'DocsLayoutClient.tsx', 'config']);

async function getPageMetadata(filePath) {
  if (!fs.existsSync(filePath) || !filePath.endsWith('page.mdx')) {
    return null;
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContent);
  return data;
}

async function buildNavigation() {
  const topLevelDirs = fs.readdirSync(DOCS_BASE_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !EXCLUDED_DIRS_FILES.has(dirent.name));

  let navigationSections = [];

  for (const sectionDir of topLevelDirs) {
    const sectionDirPath = path.join(DOCS_BASE_PATH, sectionDir.name);
    const sectionPageMdxPath = path.join(sectionDirPath, 'page.mdx');
    
    let sectionTitle = kebabToTitleCase(sectionDir.name);
    let sectionOrder = Infinity;
    let sectionDescription = '';
    let sectionHref = `/docs/${sectionDir.name}`;

    const sectionMeta = await getPageMetadata(sectionPageMdxPath);
    if (sectionMeta) {
      if (sectionMeta.title) sectionTitle = sectionMeta.title;
      if (sectionMeta.sectionOrder !== undefined) sectionOrder = sectionMeta.sectionOrder;
      if (sectionMeta.description) sectionDescription = sectionMeta.description;
    }

    let sectionItems = [];
    const itemDirs = fs.readdirSync(sectionDirPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'page.mdx' && !EXCLUDED_DIRS_FILES.has(dirent.name));

    for (const itemDir of itemDirs) {
      const itemPageMdxPath = path.join(sectionDirPath, itemDir.name, 'page.mdx');
      const itemMeta = await getPageMetadata(itemPageMdxPath);

      if (itemMeta) {
        const pageTitle = itemMeta.title || kebabToTitleCase(itemDir.name);
        const pageOrder = itemMeta.pageOrder !== undefined ? itemMeta.pageOrder : (itemMeta.order !== undefined ? itemMeta.order : Infinity);
        const pageDescription = itemMeta.description || '';
        
        sectionItems.push({
          title: pageTitle,
          href: `/docs/${sectionDir.name}/${itemDir.name}`,
          order: pageOrder,
          description: pageDescription,
        });
      }
    }

    // Sort items within the section
    sectionItems.sort((a, b) => a.order - b.order);

    // Add hardcoded items for Introduction section in specified order
    if (sectionDir.name === 'introduction') {
        // Find where 'Installation' is, if generated
        const installationIndex = sectionItems.findIndex(item => item.title.toLowerCase() === 'installation');
        const hardcodedItems = [
            { title: "Feature Roadmap", href: "https://github.com/kagent-dev/kagent/blob/main/README.md#roadmap", order: installationIndex !== -1 ? installationIndex + 1 : Infinity, external: true },
            { title: "Contributing", href: "https://github.com/kagent-dev/kagent/blob/main/CONTRIBUTION.md", order: installationIndex !== -1 ? installationIndex + 2 : Infinity, external: true },
        ];
        sectionItems.push(...hardcodedItems);
        sectionItems.sort((a, b) => a.order - b.order); // Re-sort after adding
    }
    
    // Check if the section itself is a page (has items or page.mdx)
    // For sections that are just categories, href might remain '#', 
    // but here we make section itself clickable if it has a page.mdx
    const hasContent = fs.existsSync(sectionPageMdxPath) || sectionItems.length > 0;

    if (hasContent) {
        navigationSections.push({
            title: sectionTitle,
            href: sectionHref,
            order: sectionOrder,
            description: sectionDescription,
            items: sectionItems.length > 0 ? sectionItems.map(item => ({title: item.title, href: item.href, external: item.external })) : undefined,
        });
    }
  }

  // Sort sections by sectionOrder
  navigationSections.sort((a, b) => a.order - b.order);

  const outputConfigDir = path.dirname(OUTPUT_NAV_PATH);
  if (!fs.existsSync(outputConfigDir)) {
    fs.mkdirSync(outputConfigDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_NAV_PATH, JSON.stringify(navigationSections, null, 2));
  console.log('Navigation generated at', OUTPUT_NAV_PATH);
}

buildNavigation().catch(console.error); 