#!/usr/bin/env node

/**
 * Package script for Session Guardian extension
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function packageExtension() {
  console.log('📦 Packaging Session Guardian extension...');

  const rootDir = path.join(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Read manifest to get version
  const manifestPath = path.join(distDir, 'manifest.json');
  let version = 'unknown';

  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      version = manifest.version || 'unknown';
    } catch (error) {
      console.warn('⚠️  Could not read version from manifest');
    }
  }

  const outputPath = path.join(distDir, `session-guardian-v${version}.zip`);

  // Create zip archive
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log('✅ Extension packaged successfully!');
      console.log('\n📋 Package Info:');
      console.log(`   File: ${path.basename(outputPath)}`);
      console.log(`   Size: ${size} MB`);
      console.log(`   Version: ${version}`);
      console.log(`   Location: ${outputPath}`);
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      console.error('❌ Packaging failed:', err);
      reject(err);
    });

    archive.pipe(output);

    // Add all files from dist directory
    archive.directory(distDir, false, (entry) => {
      // Exclude the output zip file itself
      if (entry.name.endsWith('.zip')) {
        return false;
      }
      return entry;
    });

    archive.finalize();
  });
}

if (require.main === module) {
  packageExtension().catch(process.exit);
}

module.exports = { packageExtension };
