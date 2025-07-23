#!/usr/bin/env node

/**
 * Validates manifest.json for Session Guardian extension
 */

const fs = require('fs');
const path = require('path');

function validateManifest() {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('❌ manifest.json not found');
    process.exit(1);
  }

  let manifest;
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    console.error('❌ Invalid JSON in manifest.json:', error.message);
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // Required fields
  const requiredFields = ['manifest_version', 'name', 'version', 'description'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Manifest version should be 3
  if (manifest.manifest_version !== 3) {
    errors.push(`Manifest version should be 3, got ${manifest.manifest_version}`);
  }

  // Check version format (semantic versioning)
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    warnings.push(`Version should follow semantic versioning (x.y.z), got ${manifest.version}`);
  }

  // Check permissions
  if (manifest.permissions) {
    const requiredPermissions = ['tabs', 'windows', 'storage', 'sessions', 'activeTab', 'scripting'];
    const missingPermissions = requiredPermissions.filter(perm =>
      !manifest.permissions.includes(perm)
    );

    if (missingPermissions.length > 0) {
      warnings.push(`Missing recommended permissions: ${missingPermissions.join(', ')}`);
    }
  }

  // Check background script
  if (!manifest.background || !manifest.background.service_worker) {
    errors.push('Missing background service worker');
  }

  // Check action (popup)
  if (!manifest.action) {
    warnings.push('No action defined - users won\'t see extension icon');
  }

  // Check icons
  if (!manifest.icons) {
    warnings.push('No icons defined - extension will use default icon');
  } else {
    const requiredSizes = [16, 32, 48, 128];
    const missingSizes = requiredSizes.filter(size => !manifest.icons[size]);
    if (missingSizes.length > 0) {
      warnings.push(`Missing icon sizes: ${missingSizes.join(', ')}`);
    }
  }

  // Check content scripts
  if (!manifest.content_scripts || manifest.content_scripts.length === 0) {
    warnings.push('No content scripts defined');
  }

  // Report results
  if (errors.length > 0) {
    console.error('❌ Manifest validation failed:');
    errors.forEach(error => console.error(`   ${error}`));

    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      warnings.forEach(warning => console.warn(`   ${warning}`));
    }

    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Manifest warnings:');
    warnings.forEach(warning => console.warn(`   ${warning}`));
  }

  console.log('✅ Manifest validation passed');

  // Output manifest info
  console.log('\n📋 Extension Info:');
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Description: ${manifest.description}`);
  console.log(`   Manifest Version: ${manifest.manifest_version}`);
  console.log(`   Permissions: ${manifest.permissions?.length || 0}`);
}

if (require.main === module) {
  validateManifest();
}

module.exports = { validateManifest };
