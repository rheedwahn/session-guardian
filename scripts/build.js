#!/usr/bin/env node

/**
 * Build script for Session Guardian extension
 */

const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  ensureDir(destDir);
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function build() {
  console.log('🔨 Building Session Guardian extension...');

  const rootDir = path.join(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');

  // Clean dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  ensureDir(distDir);

  // Copy extension files
  const filesToCopy = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js',
    'injected.js'
  ];

  console.log('📁 Copying extension files...');
  filesToCopy.forEach(file => {
    const src = path.join(rootDir, file);
    const dest = path.join(distDir, file);

    if (fs.existsSync(src)) {
      copyFile(src, dest);
      console.log(`   ✅ ${file}`);
    } else {
      console.warn(`   ⚠️  ${file} not found, skipping`);
    }
  });

  // Copy icons directory
  const iconsDir = path.join(rootDir, 'icons');
  if (fs.existsSync(iconsDir)) {
    copyDir(iconsDir, path.join(distDir, 'icons'));
    console.log('   ✅ icons/');
  }

  // Process manifest for production
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Processing for production...');

    const manifestPath = path.join(distDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Remove development fields
    delete manifest.key;
    delete manifest.update_url;

    // Ensure production settings
    if (manifest.content_security_policy) {
      // Remove unsafe-eval for production
      manifest.content_security_policy = manifest.content_security_policy
        .replace(/unsafe-eval/g, '');
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('   ✅ Manifest processed for production');
  }

  // Validate build
  console.log('🔍 Validating build...');

  const requiredFiles = ['manifest.json', 'background.js', 'popup.html'];
  const missing = requiredFiles.filter(file =>
    !fs.existsSync(path.join(distDir, file))
  );

  if (missing.length > 0) {
    console.error(`❌ Build failed - missing files: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Get build info
  const files = getAllFiles(distDir).length;

  console.log('✅ Build completed successfully!');
  console.log('\n📦 Build Summary:');
  console.log('   Output directory: dist/');
  console.log(`   Files: ${files}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Built at: ${new Date().toISOString()}`);
}

function getAllFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

if (require.main === module) {
  build();
}

module.exports = { build };
