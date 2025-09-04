#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'bright');
  console.log('='.repeat(60));
}

function logStep(step, message) {
  log(`${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkPrerequisites() {
  logHeader('🔍 Checking Prerequisites');
  
  const checks = [
    {
      name: 'Node.js',
      command: 'node',
      args: ['--version'],
      minVersion: '18.0.0'
    },
    {
      name: 'npm',
      command: 'npm',
      args: ['--version'],
      minVersion: '8.0.0'
    },
    {
      name: 'PostgreSQL',
      command: 'psql',
      args: ['--version']
    }
  ];
  
  for (const check of checks) {
    try {
      const result = spawn(check.command, check.args, { stdio: 'pipe' });
      await new Promise((resolve, reject) => {
        result.on('close', (code) => {
          if (code === 0) {
            logSuccess(`${check.name} is installed`);
            resolve();
          } else {
            reject(new Error(`${check.name} check failed`));
          }
        });
        result.on('error', () => {
          reject(new Error(`${check.name} not found`));
        });
      });
    } catch (error) {
      logError(`${check.name} is not installed or not in PATH`);
      return false;
    }
  }
  
  return true;
}

async function checkEnvironment() {
  logHeader('🔧 Checking Environment Configuration');
  
  const envFile = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envFile)) {
    logWarning('.env file not found');
    logInfo('Copying .env.example to .env...');
    
    const exampleFile = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(exampleFile)) {
      fs.copyFileSync(exampleFile, envFile);
      logSuccess('.env file created from .env.example');
      logWarning('Please update .env with your configuration before continuing');
      return false;
    } else {
      logError('.env.example file not found');
      return false;
    }
  }
  
  logSuccess('.env file exists');
  
  // Check required environment variables
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'JWT_SECRET'
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('All required environment variables are set');
  return true;
}

async function checkDatabase() {
  logHeader('🗄️  Checking Database Connection');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logSuccess('Database connection successful');
    
    // Check if tables exist
    const { rows } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    if (rows.length === 0) {
      logWarning('Database tables not found');
      logInfo('Database migration needed');
      return 'migrate';
    } else {
      logSuccess(`Found ${rows.length} database tables`);
      return 'ready';
    }
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return 'error';
  } finally {
    await pool.end();
  }
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function setupDatabase() {
  logHeader('🏗️  Setting Up Database');
  
  try {
    logStep(1, 'Running database migrations...');
    await runCommand('npm', ['run', 'db:migrate']);
    logSuccess('Database migrations completed');
    
    logStep(2, 'Seeding database with sample data...');
    await runCommand('npm', ['run', 'db:seed']);
    logSuccess('Database seeding completed');
    
    return true;
  } catch (error) {
    logError(`Database setup failed: ${error.message}`);
    return false;
  }
}

async function installDependencies() {
  logHeader('📦 Installing Dependencies');
  
  try {
    await runCommand('npm', ['install']);
    logSuccess('Dependencies installed successfully');
    return true;
  } catch (error) {
    logError(`Dependency installation failed: ${error.message}`);
    return false;
  }
}

async function startDevelopmentServer() {
  logHeader('🚀 Starting Development Server');
  
  logInfo('Starting server in development mode...');
  logInfo('The server will automatically restart when files change');
  logInfo('Press Ctrl+C to stop the server');
  
  console.log('\n' + '-'.repeat(60));
  
  try {
    await runCommand('npm', ['run', 'dev']);
  } catch (error) {
    logError(`Server startup failed: ${error.message}`);
  }
}

async function main() {
  console.clear();
  
  logHeader('🎯 Elite Credit Repair Platform - Development Setup');
  
  try {
    // Check prerequisites
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk) {
      logError('Prerequisites check failed. Please install missing software.');
      process.exit(1);
    }
    
    // Check environment
    const envOk = await checkEnvironment();
    if (!envOk) {
      logError('Environment configuration incomplete. Please update .env file.');
      process.exit(1);
    }
    
    // Install dependencies
    const depsOk = await installDependencies();
    if (!depsOk) {
      process.exit(1);
    }
    
    // Check database
    const dbStatus = await checkDatabase();
    if (dbStatus === 'error') {
      logError('Database connection failed. Please check your database configuration.');
      process.exit(1);
    }
    
    if (dbStatus === 'migrate') {
      const setupOk = await setupDatabase();
      if (!setupOk) {
        process.exit(1);
      }
    }
    
    // Start development server
    await startDevelopmentServer();
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  checkEnvironment,
  checkDatabase,
  setupDatabase,
  installDependencies
};