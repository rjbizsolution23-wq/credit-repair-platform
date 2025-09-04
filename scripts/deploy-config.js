#!/usr/bin/env node

/**
 * Rick Jefferson Solutions - Elite Credit Repair Platform
 * Production Deployment Configuration Script
 * 
 * This script helps configure the platform for production deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureProduction() {
  console.log('🚀 Rick Jefferson Solutions - Production Deployment Configuration');
  console.log('=' .repeat(70));
  console.log('');
  
  const config = {};
  
  // Domain Configuration
  console.log('📍 Domain Configuration');
  config.APP_URL = await question('Enter your production domain (e.g., https://platform.rickjeffersonsolutions.com): ');
  config.CORS_ORIGIN = config.APP_URL + ',https://rickjeffersonsolutions.com';
  console.log('');
  
  // Database Configuration
  console.log('🗄️  Database Configuration');
  config.DB_HOST = await question('Enter PostgreSQL host: ');
  config.DB_NAME = await question('Enter database name [rick_jefferson_credit_platform]: ') || 'rick_jefferson_credit_platform';
  config.DB_USER = await question('Enter database username: ');
  config.DB_PASSWORD = await question('Enter database password: ');
  console.log('');
  
  // Redis Configuration
  console.log('🔄 Redis Configuration');
  config.REDIS_HOST = await question('Enter Redis host: ');
  config.REDIS_PASSWORD = await question('Enter Redis password (optional): ');
  console.log('');
  
  // Email Configuration
  console.log('📧 Email Configuration');
  config.EMAIL_USER = await question('Enter email username [info@rickjeffersonsolutions.com]: ') || 'info@rickjeffersonsolutions.com';
  config.EMAIL_PASSWORD = await question('Enter email app password: ');
  console.log('');
  
  // Stripe Configuration
  console.log('💳 Stripe Configuration');
  config.STRIPE_PUBLISHABLE_KEY = await question('Enter Stripe publishable key (pk_live_...): ');
  config.STRIPE_SECRET_KEY = await question('Enter Stripe secret key (sk_live_...): ');
  config.STRIPE_WEBHOOK_SECRET = await question('Enter Stripe webhook secret (whsec_...): ');
  console.log('');
  
  // Cloudflare Configuration
  console.log('☁️  Cloudflare Configuration');
  const useCloudflare = await question('Are you using Cloudflare? (y/n): ');
  if (useCloudflare.toLowerCase() === 'y') {
    config.CLOUDFLARE_ZONE_ID = await question('Enter Cloudflare Zone ID: ');
    config.CLOUDFLARE_API_TOKEN = await question('Enter Cloudflare API Token: ');
    config.CLOUDFLARE_ACCOUNT_ID = await question('Enter Cloudflare Account ID: ');
  }
  console.log('');
  
  // Generate Security Keys
  console.log('🔐 Generating Security Keys...');
  config.JWT_SECRET = generateSecureKey();
  config.JWT_REFRESH_SECRET = generateSecureKey();
  config.ENCRYPTION_KEY = generateEncryptionKey();
  config.SESSION_SECRET = generateSecureKey();
  config.WEBHOOK_SECRET = generateSecureKey();
  console.log('✅ Security keys generated');
  console.log('');
  
  // Read production template
  const templatePath = path.join(__dirname, '..', '.env.production');
  let envContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  Object.entries(config).forEach(([key, value]) => {
    if (value) {
      const regex = new RegExp(`${key}=CHANGE_THIS_TO_[^\n]*`, 'g');
      envContent = envContent.replace(regex, `${key}=${value}`);
      
      // Also replace direct key matches
      const directRegex = new RegExp(`${key}=.*`, 'g');
      envContent = envContent.replace(directRegex, `${key}=${value}`);
    }
  });
  
  // Write configured production file
  const outputPath = path.join(__dirname, '..', '.env.production.configured');
  fs.writeFileSync(outputPath, envContent);
  
  console.log('🎉 Production configuration complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Review the generated .env.production.configured file');
  console.log('2. Rename it to .env.production on your production server');
  console.log('3. Update any remaining CHANGE_THIS_TO_* values manually');
  console.log('4. Set up your production database and run migrations');
  console.log('5. Deploy your application');
  console.log('');
  console.log('⚠️  SECURITY WARNING:');
  console.log('   - Never commit .env.production files to version control');
  console.log('   - Store sensitive credentials securely');
  console.log('   - Use environment variables or secret management systems');
  console.log('');
  console.log(`📁 Configuration saved to: ${outputPath}`);
  
  rl.close();
}

async function showQuickStart() {
  console.log('🚀 Rick Jefferson Solutions - Quick Production Setup');
  console.log('=' .repeat(60));
  console.log('');
  console.log('📋 Production Deployment Checklist:');
  console.log('');
  console.log('□ 1. Server Setup');
  console.log('   - Ubuntu 20.04+ or similar Linux distribution');
  console.log('   - Node.js 18+ installed');
  console.log('   - PostgreSQL 13+ installed and configured');
  console.log('   - Redis installed and configured');
  console.log('   - Nginx or Apache for reverse proxy');
  console.log('');
  console.log('□ 2. Domain & SSL');
  console.log('   - Domain pointed to your server');
  console.log('   - SSL certificate installed (Let\'s Encrypt recommended)');
  console.log('   - Cloudflare setup (optional but recommended)');
  console.log('');
  console.log('□ 3. Database Setup');
  console.log('   - PostgreSQL database created');
  console.log('   - Database user with appropriate permissions');
  console.log('   - Firewall configured for database access');
  console.log('');
  console.log('□ 4. Application Deployment');
  console.log('   - Code deployed to production server');
  console.log('   - Dependencies installed (npm install --production)');
  console.log('   - Environment variables configured');
  console.log('   - Database migrations run');
  console.log('');
  console.log('□ 5. External Services');
  console.log('   - Stripe account configured for live payments');
  console.log('   - Email service configured (Gmail, SendGrid, etc.)');
  console.log('   - SMS service configured (Twilio)');
  console.log('   - Monitoring setup (Sentry, etc.)');
  console.log('');
  console.log('□ 6. Security & Compliance');
  console.log('   - Security headers configured');
  console.log('   - Rate limiting enabled');
  console.log('   - Backup strategy implemented');
  console.log('   - Compliance features verified');
  console.log('');
  console.log('□ 7. Testing & Launch');
  console.log('   - End-to-end testing completed');
  console.log('   - Performance testing done');
  console.log('   - Monitoring and alerts configured');
  console.log('   - Launch! 🎉');
  console.log('');
  
  const runConfig = await question('Would you like to run the interactive configuration? (y/n): ');
  if (runConfig.toLowerCase() === 'y') {
    console.log('');
    await configureProduction();
  } else {
    console.log('');
    console.log('💡 Run this script again with --configure to set up production environment');
    rl.close();
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--configure') || args.includes('-c')) {
    configureProduction().catch(console.error);
  } else {
    showQuickStart().catch(console.error);
  }
}

module.exports = { configureProduction, generateSecureKey, generateEncryptionKey };