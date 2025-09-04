#!/usr/bin/env node

/**
 * Rick Jefferson Solutions Wiki Server
 * Startup script for the knowledge base platform
 */

const path = require('path')
const cluster = require('cluster')
const fs = require('fs')
const { performance } = require('perf_hooks')

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.env.CONFIG_FILE = process.env.CONFIG_FILE || path.join(__dirname, 'config.yml')

// Banner
console.log(`
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Rick Jefferson Solutions Knowledge Base                   │
│   Powered by Wiki.js                                        │
│                                                             │
│   Starting server...                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
`)

// Check if config file exists
if (!fs.existsSync(process.env.CONFIG_FILE)) {
  console.error('❌ Configuration file not found!')
  console.error(`   Expected location: ${process.env.CONFIG_FILE}`)
  console.error('   Please ensure config.yml exists in the wiki directory.')
  process.exit(1)
}

// Performance monitoring
const startTime = performance.now()

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...')
  process.exit(0)
})

// Start Wiki.js
try {
  console.log('📚 Loading Wiki.js...')
  
  // Import and start Wiki.js
  const wiki = require('wiki')
  
  // Custom initialization
  console.log('⚙️  Initializing Rick Jefferson Solutions Wiki...')
  console.log(`📁 Config file: ${process.env.CONFIG_FILE}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  
  // Start the server
  wiki.init().then(() => {
    const endTime = performance.now()
    const startupTime = Math.round(endTime - startTime)
    
    console.log(`\n✅ Rick Jefferson Solutions Knowledge Base is ready!`)
    console.log(`🚀 Server started in ${startupTime}ms`)
    console.log(`🌐 Access your wiki at: http://localhost:3000`)
    console.log(`📖 Documentation: https://docs.requarks.io`)
    console.log(`\n📋 Quick Setup:`)
    console.log(`   1. Open http://localhost:3000 in your browser`)
    console.log(`   2. Complete the initial setup wizard`)
    console.log(`   3. Create your administrator account`)
    console.log(`   4. Start building your knowledge base!`)
    console.log(`\n💡 Tips:`)
    console.log(`   • Use Ctrl+C to stop the server`)
    console.log(`   • Check config.yml for customization options`)
    console.log(`   • All your content is stored in the 'data' directory`)
    console.log(`\n─────────────────────────────────────────────────────────────\n`)
  }).catch(err => {
    console.error('❌ Failed to start Wiki.js:', err)
    process.exit(1)
  })
  
} catch (err) {
  console.error('❌ Error loading Wiki.js:', err)
  console.error('\n💡 Troubleshooting:')
  console.error('   • Ensure Wiki.js is installed: npm install wiki')
  console.error('   • Check Node.js version: node --version (requires 18+)')
  console.error('   • Verify config.yml syntax')
  process.exit(1)
}

// Health check endpoint info
setTimeout(() => {
  console.log('\n🔍 Health Check:')
  console.log('   • Server status: http://localhost:3000/healthz')
  console.log('   • Admin panel: http://localhost:3000/a')
  console.log('   • GraphQL playground: http://localhost:3000/graphql')
}, 5000)

// Periodic status updates
setInterval(() => {
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)
  
  console.log(`📊 Server Status: Running for ${hours}h ${minutes}m ${seconds}s | Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)
}, 300000) // Every 5 minutes