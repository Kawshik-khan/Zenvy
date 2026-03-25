const fs = require('fs');
const path = require('path');

const files = [
  'app/admin/page.tsx',
  'app/chat/page.tsx',
  'app/dashboard/page.tsx',
  'app/groups/page.tsx',
  'app/matching/page.tsx',
  'app/profile/page.tsx',
  'app/scheduling/page.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log('File not found: ' + file);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to remove the entire <aside>...</aside> block
  content = content.replace(/[ \t]*<aside[\s\S]*?<\/aside>[ \t]*\n/, '      <Sidebar />\n');

  // Replace <main className="ml-72 ..."> handles multiple variations
  content = content.replace(/className="([^"]*)ml-72([^"]*)"/g, 'className="$1md:ml-20 pb-20 md:pb-0$2"');

  // Add import if not exists
  if (!content.includes('import Sidebar')) {
    const importRegex = /^import .+?;?$/gm;
    let match;
    let lastIndex = -1;
    while ((match = importRegex.exec(content)) !== null) {
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex !== -1) {
      content = content.slice(0, lastIndex) + "\nimport Sidebar from '@/app/components/Sidebar';" + content.slice(lastIndex);
    } else {
      content = "import Sidebar from '@/app/components/Sidebar';\n" + content;
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
}
