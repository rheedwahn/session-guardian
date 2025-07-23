#!/usr/bin/env node

/**
 * Setup script for development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setupDevelopment() {
  console.log('🔧 Setting up Session Guardian development environment...');

  // Check if we're in a git repository
  if (!fs.existsSync('.git')) {
    console.error('❌ Not in a git repository. Please run from project root.');
    process.exit(1);
  }

  // Install dependencies if not already installed
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Make scripts executable
  const scriptsDir = path.join(__dirname, '..');
  const scripts = ['validate-manifest.js', 'validate-permissions.js', 'build.js', 'package.js', 'deploy-chrome.js'];

  scripts.forEach(script => {
    const scriptPath = path.join(scriptsDir, 'scripts', script);
    if (fs.existsSync(scriptPath)) {
      try {
        execSync(`chmod +x "${scriptPath}"`);
        console.log(`✅ Made ${script} executable`);
      } catch (error) {
        console.warn(`⚠️  Could not make ${script} executable:`, error.message);
      }
    }
  });

  // Setup git hooks
  const hooksDir = path.join('.git', 'hooks');
  const preCommitHook = path.join(hooksDir, 'pre-commit');

  if (fs.existsSync(preCommitHook)) {
    console.log('✅ Pre-commit hook already exists');
  } else {
    console.log('⚠️  Pre-commit hook not found');
  }

  // Run initial validation
  console.log('🔍 Running initial validation...');

  try {
    execSync('npm run validate:manifest', { stdio: 'inherit' });
    console.log('✅ Manifest validation passed');
  } catch (error) {
    console.error('❌ Manifest validation failed');
  }

  try {
    execSync('npm run validate:permissions', { stdio: 'inherit' });
    console.log('✅ Permission validation passed');
  } catch (error) {
    console.error('❌ Permission validation failed');
  }

  // Create development build
  console.log('🔨 Creating development build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Development build completed');
  } catch (error) {
    console.error('❌ Build failed');
  }

  console.log('\n🎉 Development environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Load extension in Chrome (npm run load-extension)');
  console.log('2. Run tests (npm test)');
  console.log('3. Start development (npm run watch)');
  console.log('4. Read TESTING.md for testing guidelines');

  console.log('\n🛠️  Available commands:');
  console.log('   npm test              - Run all tests');
  console.log('   npm run test:watch    - Run tests in watch mode');
  console.log('   npm run lint          - Fix code style issues');
  console.log('   npm run build         - Build extension');
  console.log('   npm run package       - Create distribution package');
  console.log('   npm run watch         - Watch for changes and rebuild');

  console.log('\n📚 Documentation:');
  console.log('   README.md     - Project overview');
  console.log('   TESTING.md    - Testing guide');
  console.log('   CONTRIBUTING.md - Contribution guidelines');
}

if (require.main === module) {
  setupDevelopment();
}

module.exports = { setupDevelopment };
