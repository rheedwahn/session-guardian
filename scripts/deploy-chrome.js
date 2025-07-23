#!/usr/bin/env node

/**
 * Deploy script for Session Guardian extension to Chrome Web Store
 */

const fs = require('fs');
const path = require('path');

async function deployToChrome() {
  console.log('🚀 Deploying Session Guardian to Chrome Web Store...');

  // Check if we have required environment variables
  const requiredEnvs = ['CHROME_CLIENT_ID', 'CHROME_CLIENT_SECRET', 'CHROME_REFRESH_TOKEN', 'CHROME_APP_ID'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvs.forEach(env => console.error(`   ${env}`));
    console.log('\n📖 Setup instructions:');
    console.log('1. Go to Google Cloud Console');
    console.log('2. Create OAuth 2.0 credentials');
    console.log('3. Get refresh token using OAuth 2.0 playground');
    console.log('4. Set environment variables in GitHub Secrets');
    process.exit(1);
  }

  // Check if build exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Find the package file
  const packageFiles = fs.readdirSync(distDir).filter(file => file.endsWith('.zip'));
  if (packageFiles.length === 0) {
    console.error('❌ No package file found. Run "npm run package" first.');
    process.exit(1);
  }

  const packagePath = path.join(distDir, packageFiles[0]);
  console.log(`📦 Using package: ${packageFiles[0]}`);

  try {
    // Use chrome-webstore-upload if installed
    const chromeWebstoreUpload = require('chrome-webstore-upload');

    const webStore = chromeWebstoreUpload({
      extensionId: process.env.CHROME_APP_ID,
      clientId: process.env.CHROME_CLIENT_ID,
      clientSecret: process.env.CHROME_CLIENT_SECRET,
      refreshToken: process.env.CHROME_REFRESH_TOKEN
    });

    // Upload the package
    console.log('📤 Uploading to Chrome Web Store...');
    const uploadResult = await webStore.uploadExisting(fs.createReadStream(packagePath));

    if (uploadResult.uploadState === 'SUCCESS') {
      console.log('✅ Upload successful!');

      // Publish the extension
      console.log('🌐 Publishing extension...');
      const publishResult = await webStore.publish();

      if (publishResult.status.includes('OK')) {
        console.log('🎉 Extension published successfully!');
        console.log('\n📋 Deployment Summary:');
        console.log(`   Extension ID: ${process.env.CHROME_APP_ID}`);
        console.log(`   Package: ${packageFiles[0]}`);
        console.log('   Status: Published');
        console.log(`   Store URL: https://chrome.google.com/webstore/detail/${process.env.CHROME_APP_ID}`);
      } else {
        console.error('❌ Publishing failed:', publishResult);
        process.exit(1);
      }
    } else {
      console.error('❌ Upload failed:', uploadResult);
      process.exit(1);
    }

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ chrome-webstore-upload not installed.');
      console.log('Install it with: npm install chrome-webstore-upload');
    } else {
      console.error('❌ Deployment failed:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  deployToChrome().catch(console.error);
}

module.exports = { deployToChrome };
