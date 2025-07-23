#!/usr/bin/env node

/**
 * Validates permissions for Session Guardian extension
 */

const fs = require('fs');
const path = require('path');

function validatePermissions() {
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

  if (!manifest.permissions) {
    errors.push('No permissions defined');
    console.error('❌ Permission validation failed:');
    errors.forEach(error => console.error(`   ${error}`));
    process.exit(1);
  }

  const permissions = manifest.permissions;

  // Define permission categories and their security levels
  const permissionInfo = {
    'tabs': {
      level: 'medium',
      description: 'Access to tab information and management',
      required: true,
      justification: 'Needed to save and restore tab states'
    },
    'windows': {
      level: 'medium',
      description: 'Access to window information and management',
      required: true,
      justification: 'Needed to save and restore window layouts'
    },
    'storage': {
      level: 'low',
      description: 'Access to local storage for session data',
      required: true,
      justification: 'Needed to persist saved sessions'
    },
    'sessions': {
      level: 'medium',
      description: 'Access to browser session information',
      required: true,
      justification: 'Needed for crash recovery and session restoration'
    },
    'activeTab': {
      level: 'low',
      description: 'Access to current active tab',
      required: true,
      justification: 'Needed to get scroll positions and page data'
    },
    'scripting': {
      level: 'medium',
      description: 'Ability to inject scripts into pages',
      required: true,
      justification: 'Needed to get scroll positions from pages'
    }
  };

  // Check for required permissions
  const requiredPermissions = Object.keys(permissionInfo).filter(
    perm => permissionInfo[perm].required
  );

  const missingPermissions = requiredPermissions.filter(
    perm => !permissions.includes(perm)
  );

  if (missingPermissions.length > 0) {
    errors.push(`Missing required permissions: ${missingPermissions.join(', ')}`);
  }

  // Check for unnecessary or suspicious permissions
  const knownPermissions = Object.keys(permissionInfo);
  const unknownPermissions = permissions.filter(
    perm => !knownPermissions.includes(perm) && !perm.startsWith('http')
  );

  if (unknownPermissions.length > 0) {
    warnings.push(`Unknown permissions (review needed): ${unknownPermissions.join(', ')}`);
  }

  // Check for high-risk permissions
  const highRiskPermissions = permissions.filter(perm => {
    const info = permissionInfo[perm];
    return info && info.level === 'high';
  });

  if (highRiskPermissions.length > 0) {
    warnings.push(`High-risk permissions detected: ${highRiskPermissions.join(', ')}`);
  }

  // Check for overly broad host permissions
  const hostPermissions = permissions.filter(perm =>
    perm.startsWith('http') || perm.includes('*')
  );

  if (hostPermissions.includes('<all_urls>')) {
    warnings.push('Using <all_urls> permission - consider limiting to specific domains');
  }

  // Report results
  if (errors.length > 0) {
    console.error('❌ Permission validation failed:');
    errors.forEach(error => console.error(`   ${error}`));

    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      warnings.forEach(warning => console.warn(`   ${warning}`));
    }

    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Permission warnings:');
    warnings.forEach(warning => console.warn(`   ${warning}`));
  }

  console.log('✅ Permission validation passed');

  // Output permission analysis
  console.log('\n🔐 Permission Analysis:');
  permissions.forEach(permission => {
    const info = permissionInfo[permission];
    if (info) {
      console.log(`   ${permission}: ${info.description}`);
      console.log(`      Security Level: ${info.level}`);
      console.log(`      Justification: ${info.justification}`);
    } else {
      console.log(`   ${permission}: Custom permission`);
    }
  });

  console.log('\n📊 Summary:');
  console.log(`   Total permissions: ${permissions.length}`);
  console.log(`   Required permissions: ${requiredPermissions.length}`);
  console.log(`   Host permissions: ${hostPermissions.length}`);
}

if (require.main === module) {
  validatePermissions();
}

module.exports = { validatePermissions };
