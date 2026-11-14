const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDirs = [
  path.join(__dirname, '../../admin/public'),
  path.join(__dirname, '../../storefront/public')
];

const filesToCopy = [
  { src: 'favicon.ico', dest: 'favicon.ico' },
  { src: 'favicon.png', dest: 'favicon.png' },
  { src: 'images/logo-dark.png', dest: 'images/logo-dark.png' },
  { src: 'images/logo-light.png', dest: 'images/logo-light.png' }
];

console.log('[Assets] Copying shared brand assets to applications...');

for (const destDir of destDirs) {
  for (const file of filesToCopy) {
    const srcPath = path.join(srcDir, file.src);
    const destPath = path.join(destDir, file.dest);

    // Ensure destination directory exists
    const destParent = path.dirname(destPath);
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true });
    }

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`- Copied ${file.src} -> ${path.relative(path.join(__dirname, '../..'), destPath)}`);
    } else {
      console.warn(`[Assets] Warning: Source file ${srcPath} not found.`);
    }
  }
}

console.log('[Assets] Asset synchronization complete.');
