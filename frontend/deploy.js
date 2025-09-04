#!/usr/bin/env node

/**
 * Rick Jefferson Solutions - Frontend Deployment Script
 * Automated deployment to static hosting platforms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = {
  projectName: 'rick-jefferson-credit-repair',
  buildDir: 'dist',
  outputDir: 'dist/rick-jefferson-credit-repair',
  deploymentPlatforms: {
    netlify: {
      enabled: false,
      siteId: process.env.NETLIFY_SITE_ID || '',
      accessToken: process.env.NETLIFY_ACCESS_TOKEN || ''
    },
    vercel: {
      enabled: false,
      projectId: process.env.VERCEL_PROJECT_ID || ''
    },
    cloudflarePages: {
      enabled: true,
      projectName: 'rick-jefferson-solutions',
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || ''
    }
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkPrerequisites() {
  log('Checking deployment prerequisites...');
  
  // Check if Node.js and npm are available
  try {
    execSync('node --version', { stdio: 'pipe' });
    execSync('npm --version', { stdio: 'pipe' });
    log('Node.js and npm are available', 'success');
  } catch (error) {
    log('Node.js or npm not found', 'error');
    return false;
  }
  
  // Check if Angular CLI is available
  try {
    execSync('npx ng version', { stdio: 'pipe' });
    log('Angular CLI is available', 'success');
  } catch (error) {
    log('Angular CLI not found, will install locally', 'info');
  }
  
  return true;
}

function buildApplication() {
  log('Building Rick Jefferson Solutions frontend...');
  
  try {
    // Clean previous build
    if (fs.existsSync(config.buildDir)) {
      fs.rmSync(config.buildDir, { recursive: true, force: true });
      log('Cleaned previous build directory');
    }
    
    // Build the application
    log('Starting Angular build process...');
    execSync('npx ng build --configuration production --base-href="/"', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('Angular build completed successfully', 'success');
    return true;
  } catch (error) {
    log(`Build failed: ${error.message}`, 'error');
    return false;
  }
}

function createDeploymentFiles() {
  log('Creating deployment configuration files...');
  
  const outputPath = config.outputDir;
  
  if (!fs.existsSync(outputPath)) {
    log(`Build output directory not found: ${outputPath}`, 'error');
    return false;
  }
  
  // Create _redirects file for SPA routing
  const redirectsContent = `# Rick Jefferson Solutions - SPA Redirects
/*    /index.html   200

# API Proxy (if needed)
/api/*  http://localhost:8000/api/:splat  200

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
`;
  
  fs.writeFileSync(path.join(outputPath, '_redirects'), redirectsContent);
  log('Created _redirects file for SPA routing');
  
  // Create netlify.toml
  const netlifyConfig = `[build]
  publish = "dist/rick-jefferson-credit-repair"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
`;
  
  fs.writeFileSync('netlify.toml', netlifyConfig);
  log('Created netlify.toml configuration');
  
  // Create vercel.json
  const vercelConfig = {
    version: 2,
    name: 'rick-jefferson-solutions',
    builds: [
      {
        src: 'package.json',
        use: '@vercel/static-build',
        config: {
          distDir: 'dist/rick-jefferson-credit-repair'
        }
      }
    ],
    routes: [
      {
        handle: 'filesystem'
      },
      {
        src: '/.*',
        dest: '/index.html'
      }
    ],
    headers: [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  };
  
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  log('Created vercel.json configuration');
  
  return true;
}

function generateDeploymentInstructions() {
  const instructions = `
# Rick Jefferson Solutions - Deployment Instructions

## Your Credit Freedom Starts Here - Frontend Deployment

### Build Status: ✅ READY FOR DEPLOYMENT

**Project:** Rick Jefferson Solutions Credit Repair Platform
**Contact:** info@rickjeffersonsolutions.com | 877-763-8587
**SMS:** Text 'credit repair' to 945-308-8003

---

## Deployment Options

### 1. Netlify (Recommended)
\`\`\`bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to Netlify
netlify deploy --prod --dir=dist/rick-jefferson-credit-repair
\`\`\`

### 2. Vercel
\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod
\`\`\`

### 3. Cloudflare Pages
\`\`\`bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages publish dist/rick-jefferson-credit-repair --project-name=rick-jefferson-solutions
\`\`\`

### 4. Manual Upload
Upload the contents of \`dist/rick-jefferson-credit-repair/\` to any static hosting provider.

---

## Post-Deployment Checklist

- [ ] Verify homepage loads with Rick Jefferson branding
- [ ] Test navigation between pages
- [ ] Confirm API endpoints are accessible
- [ ] Validate contact information display
- [ ] Test responsive design on mobile devices
- [ ] Verify SSL certificate is active
- [ ] Check that all Rick Jefferson Solutions branding is correct

---

## Environment Configuration

Update these environment variables in your hosting platform:

\`\`\`
API_BASE_URL=https://your-backend-domain.com
PRODUCTION=true
CONTACT_EMAIL=info@rickjeffersonsolutions.com
CONTACT_PHONE=877-763-8587
SMS_NUMBER=945-308-8003
\`\`\`

---

**Trusted by NFL Athletes & Dallas Cowboys**
**10 Step Total Enforcement Chain™**

For technical support: info@rickjeffersonsolutions.com
`;
  
  fs.writeFileSync('DEPLOYMENT.md', instructions);
  log('Generated deployment instructions', 'success');
}

function main() {
  log('🚀 Rick Jefferson Solutions - Frontend Deployment');
  log('Your Credit Freedom Starts Here - Deploying Platform...');
  
  if (!checkPrerequisites()) {
    log('Prerequisites check failed', 'error');
    process.exit(1);
  }
  
  if (!buildApplication()) {
    log('Application build failed', 'error');
    process.exit(1);
  }
  
  if (!createDeploymentFiles()) {
    log('Deployment file creation failed', 'error');
    process.exit(1);
  }
  
  generateDeploymentInstructions();
  
  log('🎉 Frontend deployment preparation completed!', 'success');
  log('📋 Check DEPLOYMENT.md for next steps');
  log('📞 Contact: info@rickjeffersonsolutions.com | 877-763-8587');
  log('📱 SMS: Text "credit repair" to 945-308-8003');
}

if (require.main === module) {
  main();
}

module.exports = { main, buildApplication, createDeploymentFiles };