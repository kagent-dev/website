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
  const topLevelSections = fs.readdirSync(DOCS_BASE_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !EXCLUDED_DIRS_FILES.has(dirent.name));

  let allSections = [];

  for (const topLevelSection of topLevelSections) {
    const topLevelSectionPath = path.join(DOCS_BASE_PATH, topLevelSection.name);
    const topLevelPageMdxPath = path.join(topLevelSectionPath, 'page.mdx');
    
    let topLevelTitle = kebabToTitleCase(topLevelSection.name);
    let topLevelOrder = Infinity;
    let topLevelDescription = '';
    let topLevelHref = `/docs/${topLevelSection.name}`;

    // Get metadata for the top-level section (e.g., kagent)
    const topLevelMeta = await getPageMetadata(topLevelPageMdxPath);
    if (topLevelMeta) {
      if (topLevelMeta.title) topLevelTitle = topLevelMeta.title;
      if (topLevelMeta.sectionOrder !== undefined) topLevelOrder = topLevelMeta.sectionOrder;
      if (topLevelMeta.description) topLevelDescription = topLevelMeta.description;
    }

    // Get all subsections within this top-level section
    const subSectionDirs = fs.readdirSync(topLevelSectionPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !EXCLUDED_DIRS_FILES.has(dirent.name));

    let subSections = [];

    for (const subSectionDir of subSectionDirs) {
      const subSectionDirPath = path.join(topLevelSectionPath, subSectionDir.name);
      const subSectionPageMdxPath = path.join(subSectionDirPath, 'page.mdx');
      
      let subSectionTitle = kebabToTitleCase(subSectionDir.name);
      let subSectionOrder = Infinity;
      let subSectionDescription = '';
      let subSectionHref = `/docs/${topLevelSection.name}/${subSectionDir.name}`;

      const subSectionMeta = await getPageMetadata(subSectionPageMdxPath);
      if (subSectionMeta) {
        if (subSectionMeta.title) subSectionTitle = subSectionMeta.title;
        if (subSectionMeta.sectionOrder !== undefined) subSectionOrder = subSectionMeta.sectionOrder;
        if (subSectionMeta.description) subSectionDescription = subSectionMeta.description;
      }

      let subSectionItems = [];
      const itemDirs = fs.readdirSync(subSectionDirPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'page.mdx' && !EXCLUDED_DIRS_FILES.has(dirent.name));

      for (const itemDir of itemDirs) {
        const itemPageMdxPath = path.join(subSectionDirPath, itemDir.name, 'page.mdx');
        const itemMeta = await getPageMetadata(itemPageMdxPath);

        if (itemMeta) {
          const pageTitle = itemMeta.title || kebabToTitleCase(itemDir.name);
          const pageOrder = itemMeta.pageOrder !== undefined ? itemMeta.pageOrder : (itemMeta.order !== undefined ? itemMeta.order : Infinity);
          const pageDescription = itemMeta.description || '';
          
          subSectionItems.push({
            title: pageTitle,
            href: `/docs/${topLevelSection.name}/${subSectionDir.name}/${itemDir.name}`,
            order: pageOrder,
            description: pageDescription,
          });
        }
      }

      // Sort items within the subsection
      subSectionItems.sort((a, b) => a.order - b.order);

      // Add hardcoded items for Introduction section in kagent (keeping this specific to kagent for now)
      if (topLevelSection.name === 'kagent' && subSectionDir.name === 'introduction') {
          // Find where 'Installation' is, if generated
          const installationIndex = subSectionItems.findIndex(item => item.title.toLowerCase() === 'installation');
          const hardcodedItems = [
              { title: "Feature Roadmap", href: "https://github.com/kagent-dev/kagent/blob/main/README.md#roadmap", order: installationIndex !== -1 ? installationIndex + 1 : Infinity, external: true },
              { title: "Contributing", href: "https://github.com/kagent-dev/kagent/blob/main/CONTRIBUTING.md", order: installationIndex !== -1 ? installationIndex + 2 : Infinity, external: true },
          ];
          subSectionItems.push(...hardcodedItems);
          subSectionItems.sort((a, b) => a.order - b.order); // Re-sort after adding
      }
      
      // Check if the subsection itself is a page (has items or page.mdx)
      const hasContent = fs.existsSync(subSectionPageMdxPath) || subSectionItems.length > 0;

      if (hasContent) {
          subSections.push({
              title: subSectionTitle,
              href: subSectionHref,
              order: subSectionOrder,
              description: subSectionDescription,
              items: subSectionItems.length > 0 ? subSectionItems.map(item => ({title: item.title, href: item.href, description: item.description, external: item.external })) : undefined,
          });
      }
    }

    // Sort subsections by order
    subSections.sort((a, b) => a.order - b.order);

    // Check if the top-level section has content
    const hasTopLevelContent = fs.existsSync(topLevelPageMdxPath) || subSections.length > 0;

    if (hasTopLevelContent) {
        allSections.push({
            title: topLevelTitle,
            href: topLevelHref,
            order: topLevelOrder,
            description: topLevelDescription,
            items: subSections.length > 0 ? subSections.map(section => ({
              title: section.title,
              href: section.href,
              description: section.description,
              items: section.items
            })) : undefined,
        });
    }
  }

  // Sort all sections by order
  allSections.sort((a, b) => a.order - b.order);

  const outputConfigDir = path.dirname(OUTPUT_NAV_PATH);
  if (!fs.existsSync(outputConfigDir)) {
    fs.mkdirSync(outputConfigDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_NAV_PATH, JSON.stringify(allSections, null, 2));
  console.log('Navigation generated at', OUTPUT_NAV_PATH);
}

buildNavigation().catch(console.error); 