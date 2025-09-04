const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
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

// Migration SQL
const migrations = [
  {
    name: '001_initial_schema',
    sql: `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        two_factor_enabled BOOLEAN DEFAULT false,
        two_factor_secret VARCHAR(255),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Clients table
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        date_of_birth DATE,
        ssn_last_four VARCHAR(4),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Disputes table
      CREATE TABLE IF NOT EXISTS disputes (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        bureau VARCHAR(50) NOT NULL,
        account_name VARCHAR(255),
        account_number VARCHAR(100),
        dispute_reason VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        date_filed DATE DEFAULT CURRENT_DATE,
        expected_completion DATE,
        actual_completion DATE,
        result VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Documents table
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        document_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'uploaded',
        processed_at TIMESTAMP,
        extracted_text TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Letters table
      CREATE TABLE IF NOT EXISTS letters (
        id SERIAL PRIMARY KEY,
        dispute_id INTEGER REFERENCES disputes(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        template_name VARCHAR(255),
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        sent_date DATE,
        recipient VARCHAR(255),
        tracking_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Payments table
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method VARCHAR(50),
        payment_intent_id VARCHAR(255),
        transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        description TEXT,
        metadata JSONB,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Credit Reports table
      CREATE TABLE IF NOT EXISTS credit_reports (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        bureau VARCHAR(50) NOT NULL,
        report_date DATE DEFAULT CURRENT_DATE,
        credit_score INTEGER,
        report_data JSONB,
        file_path VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unread',
        priority VARCHAR(20) DEFAULT 'normal',
        scheduled_for TIMESTAMP,
        sent_at TIMESTAMP,
        read_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Audit Logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        description TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        risk_level VARCHAR(20) DEFAULT 'low',
        session_id VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Compliance Logs table
      CREATE TABLE IF NOT EXISTS compliance_logs (
        id SERIAL PRIMARY KEY,
        regulation_type VARCHAR(100) NOT NULL,
        compliance_check VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        details TEXT,
        remediation_required BOOLEAN DEFAULT false,
        remediation_notes TEXT,
        checked_by INTEGER REFERENCES users(id),
        next_check_due DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Backups table
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        backup_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        checksum VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        compression_ratio DECIMAL(5,2),
        encrypted BOOLEAN DEFAULT false,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        duration INTEGER,
        error_message TEXT,
        metadata JSONB
      );

      -- Backup Schedules table
      CREATE TABLE IF NOT EXISTS backup_schedules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        backup_type VARCHAR(50) NOT NULL,
        cron_expression VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        retention_days INTEGER DEFAULT 30,
        compression BOOLEAN DEFAULT true,
        encryption BOOLEAN DEFAULT false,
        last_run TIMESTAMP,
        next_run TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        data_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
      CREATE INDEX IF NOT EXISTS idx_disputes_client_id ON disputes(client_id);
      CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
      CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
      CREATE INDEX IF NOT EXISTS idx_letters_dispute_id ON letters(dispute_id);
      CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_credit_reports_client_id ON credit_reports(client_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
      CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create triggers for updated_at
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
      CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
      CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
      CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_letters_updated_at ON letters;
      CREATE TRIGGER update_letters_updated_at BEFORE UPDATE ON letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
      CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_credit_reports_updated_at ON credit_reports;
      CREATE TRIGGER update_credit_reports_updated_at BEFORE UPDATE ON credit_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_backup_schedules_updated_at ON backup_schedules;
      CREATE TRIGGER update_backup_schedules_updated_at BEFORE UPDATE ON backup_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
      CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
  },
  {
    name: '002_default_settings',
    sql: `
      -- Insert default settings
      INSERT INTO settings (key, value, data_type, description, is_public) VALUES
        ('app_name', 'Elite Credit Repair Platform', 'string', 'Application name', true),
        ('app_version', '1.0.0', 'string', 'Application version', true),
        ('max_file_size', '10485760', 'number', 'Maximum file upload size in bytes', false),
        ('allowed_file_types', 'pdf,doc,docx,jpg,jpeg,png,gif,txt', 'string', 'Allowed file types for upload', false),
        ('backup_retention_days', '30', 'number', 'Number of days to retain backups', false),
        ('notification_email_enabled', 'true', 'boolean', 'Enable email notifications', false),
        ('notification_sms_enabled', 'false', 'boolean', 'Enable SMS notifications', false),
        ('audit_log_retention_days', '365', 'number', 'Number of days to retain audit logs', false),
        ('default_dispute_timeline', '30', 'number', 'Default dispute timeline in days', false),
        ('credit_score_monitoring_enabled', 'true', 'boolean', 'Enable credit score monitoring', false)
      ON CONFLICT (key) DO NOTHING;
    `
  },
  {
    name: '003_admin_user',
    sql: `
      -- Create default admin user (password: admin123 - CHANGE THIS!)
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
      VALUES (
        'admin@creditrepair.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'admin123'
        'System',
        'Administrator',
        'admin',
        true,
        true
      )
      ON CONFLICT (email) DO NOTHING;
    `
  }
];

// Migration tracking table
const createMigrationTable = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Create migrations table
    await client.query(createMigrationTable);
    console.log('✅ Migration tracking table ready');
    
    // Get executed migrations
    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations ORDER BY executed_at'
    );
    const executedNames = executedMigrations.map(row => row.name);
    
    // Run pending migrations
    for (const migration of migrations) {
      if (executedNames.includes(migration.name)) {
        console.log(`⏭️  Skipping ${migration.name} (already executed)`);
        continue;
      }
      
      console.log(`🔄 Running migration: ${migration.name}`);
      
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        await client.query('COMMIT');
        console.log(`✅ Migration ${migration.name} completed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration ${migration.name} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Check database connection
async function checkConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your database configuration in .env file');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🏗️  Elite Credit Repair Platform - Database Migration');
  console.log('================================================');
  
  // Check connection first
  const connected = await checkConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Run migrations
  await runMigrations();
  
  console.log('\n🎯 Migration Summary:');
  console.log('- Database schema created');
  console.log('- Default settings inserted');
  console.log('- Admin user created (email: admin@creditrepair.com, password: admin123)');
  console.log('\n⚠️  IMPORTANT: Change the default admin password after first login!');
  console.log('\n🚀 Your Credit Repair Platform is ready to use!');
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  checkConnection
};