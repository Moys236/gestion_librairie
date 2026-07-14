const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const openNextDir = path.join(process.cwd(), '.open-next');
const assetsDir = path.join(openNextDir, 'assets');

// 1. Copy worker.js to assets/_worker.js
fs.copyFileSync(
  path.join(openNextDir, 'worker.js'),
  path.join(assetsDir, '_worker.js')
);

// 2. Copy other required directories to assets/
const dirsToCopy = ['.build', 'cloudflare', 'middleware', 'server-functions'];
dirsToCopy.forEach((dirName) => {
  const srcPath = path.join(openNextDir, dirName);
  const destPath = path.join(assetsDir, dirName);
  if (fs.existsSync(srcPath)) {
    copyRecursiveSync(srcPath, destPath);
  }
});

console.log('Worker and dependency assets successfully copied to .open-next/assets!');
