const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'credit_repair_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// List of tables in dependency order (reverse for dropping)
const tables = [
  'audit_logs',
  'compliance_logs',
  'backup_schedules',
  'backups',
  'notifications',
  'credit_reports',
  'payments',
  'letters',
  'documents',
  'disputes',
  'clients',
  'users',
  'settings',
  'migrations'
];

// List of sequences to reset
const sequences = [
  'users_id_seq',
  'clients_id_seq',
  'disputes_id_seq',
  'documents_id_seq',
  'letters_id_seq',
  'payments_id_seq',
  'credit_reports_id_seq',
  'notifications_id_seq',
  'audit_logs_id_seq',
  'compliance_logs_id_seq',
  'backups_id_seq',
  'backup_schedules_id_seq',
  'settings_id_seq'
];

async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function dropAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Dropping all tables...');
    
    // Disable foreign key checks temporarily
    await client.query('SET session_replication_role = replica;');
    
    // Drop tables in reverse dependency order
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop table ${table}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await client.query('SET session_replication_role = DEFAULT;');
    
    console.log('✅ All tables dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function dropAllSequences() {
  const client = await pool.connect();
  
  try {
    console.log('🔢 Dropping all sequences...');
    
    for (const sequence of sequences) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS ${sequence} CASCADE`);
        console.log(`   ✅ Dropped sequence: ${sequence}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop sequence ${sequence}: ${error.message}`);
      }
    }
    
    console.log('✅ All sequences dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping sequences:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function dropAllFunctions() {
  const client = await pool.connect();
  
  try {
    console.log('⚙️  Dropping all custom functions...');
    
    // Get list of custom functions
    const { rows: functions } = await client.query(`
      SELECT routine_name, routine_schema
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      AND routine_name LIKE '%updated_at%'
    `);
    
    for (const func of functions) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS ${func.routine_name}() CASCADE`);
        console.log(`   ✅ Dropped function: ${func.routine_name}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop function ${func.routine_name}: ${error.message}`);
      }
    }
    
    console.log('✅ All custom functions dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping functions:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function clearUploadsDirectory() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    console.log('📁 Clearing uploads directory...');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      console.log('   ℹ️  Uploads directory does not exist, skipping...');
      return;
    }
    
    // Get all subdirectories
    const subdirs = await fs.readdir(uploadsDir, { withFileTypes: true });
    
    for (const subdir of subdirs) {
      if (subdir.isDirectory()) {
        const subdirPath = path.join(uploadsDir, subdir.name);
        try {
          await fs.rmdir(subdirPath, { recursive: true });
          console.log(`   ✅ Cleared directory: ${subdir.name}`);
        } catch (error) {
          console.log(`   ⚠️  Could not clear directory ${subdir.name}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Uploads directory cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing uploads directory:', error);
    // Don't throw - this is not critical
  }
}

async function clearBackupsDirectory() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    console.log('💾 Clearing backups directory...');
    
    const backupsDir = path.join(process.cwd(), 'backups');
    
    // Check if backups directory exists
    try {
      await fs.access(backupsDir);
    } catch {
      console.log('   ℹ️  Backups directory does not exist, skipping...');
      return;
    }
    
    // Get all files in backups directory
    const files = await fs.readdir(backupsDir);
    
    for (const file of files) {
      if (file !== '.gitkeep') { // Keep .gitkeep file
        const filePath = path.join(backupsDir, file);
        try {
          await fs.unlink(filePath);
          console.log(`   ✅ Deleted backup file: ${file}`);
        } catch (error) {
          console.log(`   ⚠️  Could not delete file ${file}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Backups directory cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing backups directory:', error);
    // Don't throw - this is not critical
  }
}

async function clearAuditLogsDirectory() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    console.log('📝 Clearing audit logs directory...');
    
    const auditLogsDir = path.join(process.cwd(), 'audit_logs');
    
    // Check if audit logs directory exists
    try {
      await fs.access(auditLogsDir);
    } catch {
      console.log('   ℹ️  Audit logs directory does not exist, skipping...');
      return;
    }
    
    // Get all files in audit logs directory
    const files = await fs.readdir(auditLogsDir);
    
    for (const file of files) {
      if (file !== '.gitkeep') { // Keep .gitkeep file
        const filePath = path.join(auditLogsDir, file);
        try {
          await fs.unlink(filePath);
          console.log(`   ✅ Deleted audit log file: ${file}`);
        } catch (error) {
          console.log(`   ⚠️  Could not delete file ${file}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Audit logs directory cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing audit logs directory:', error);
    // Don't throw - this is not critical
  }
}

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // Check database connection
    const connected = await checkDatabaseConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
    
    // Drop all tables
    await dropAllTables();
    
    // Drop all sequences
    await dropAllSequences();
    
    // Drop all custom functions
    await dropAllFunctions();
    
    // Clear file directories
    await clearUploadsDirectory();
    await clearBackupsDirectory();
    await clearAuditLogsDirectory();
    
    console.log('✅ Database reset completed successfully!');
    
  } catch (error) {
    console.error('💥 Database reset failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🔄 Elite Credit Repair Platform - Database Reset');
  console.log('================================================');
  console.log('⚠️  WARNING: This will permanently delete ALL data!');
  
  // Check if running in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run reset script in production environment!');
    process.exit(1);
  }
  
  // Check for confirmation in non-interactive environments
  const args = process.argv.slice(2);
  const forceReset = args.includes('--force') || args.includes('-f');
  
  if (!forceReset) {
    console.log('\n🛑 To proceed with the reset, run:');
    console.log('   npm run db:reset -- --force');
    console.log('   or');
    console.log('   node scripts/reset.js --force');
    console.log('\n💡 This safety check prevents accidental data loss.');
    process.exit(0);
  }
  
  try {
    await resetDatabase();
    
    console.log('\n🎯 Reset Summary:');
    console.log('- All database tables dropped');
    console.log('- All sequences reset');
    console.log('- All custom functions removed');
    console.log('- Upload files cleared');
    console.log('- Backup files cleared');
    console.log('- Audit log files cleared');
    
    console.log('\n🚀 Database is now clean and ready for migration!');
    console.log('   Run: npm run db:migrate');
    console.log('   Then: npm run db:seed');
    
  } catch (error) {
    console.error('💥 Reset script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  resetDatabase,
  dropAllTables,
  dropAllSequences,
  dropAllFunctions
};