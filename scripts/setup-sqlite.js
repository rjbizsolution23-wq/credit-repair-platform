const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Ensure database directory exists
const dbDir = path.dirname(process.env.DB_PATH || './database/credit_repair_platform.db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './database/credit_repair_platform.db';
const db = new sqlite3.Database(dbPath);

// SQLite schema (converted from PostgreSQL)
const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT 1,
  email_verified BOOLEAN DEFAULT 0,
  two_factor_enabled BOOLEAN DEFAULT 0,
  two_factor_secret VARCHAR(255),
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  bureau VARCHAR(50) NOT NULL,
  account_name VARCHAR(255),
  account_number VARCHAR(100),
  dispute_reason VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  date_filed DATE DEFAULT (date('now')),
  expected_completion DATE,
  actual_completion DATE,
  result VARCHAR(50),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  document_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'uploaded',
  processed_at DATETIME,
  extracted_text TEXT,
  metadata TEXT, -- JSON as TEXT in SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Letters table
CREATE TABLE IF NOT EXISTS letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispute_id INTEGER REFERENCES disputes(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  template_name VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  sent_date DATE,
  recipient VARCHAR(255),
  tracking_number VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(255),
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  description TEXT,
  metadata TEXT, -- JSON as TEXT in SQLite
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Credit Reports table
CREATE TABLE IF NOT EXISTS credit_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  bureau VARCHAR(50) NOT NULL,
  report_date DATE DEFAULT (date('now')),
  credit_score INTEGER,
  report_data TEXT, -- JSON as TEXT in SQLite
  file_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  priority VARCHAR(20) DEFAULT 'normal',
  scheduled_for DATETIME,
  sent_at DATETIME,
  read_at DATETIME,
  metadata TEXT, -- JSON as TEXT in SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  description TEXT,
  old_values TEXT, -- JSON as TEXT in SQLite
  new_values TEXT, -- JSON as TEXT in SQLite
  ip_address VARCHAR(45),
  user_agent TEXT,
  risk_level VARCHAR(20) DEFAULT 'low',
  session_id VARCHAR(255),
  metadata TEXT, -- JSON as TEXT in SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  data_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
`;

// Default settings data
const defaultSettings = `
INSERT OR IGNORE INTO settings (key, value, data_type, description, is_public) VALUES
  ('app_name', 'Elite Credit Repair Platform', 'string', 'Application name', 1),
  ('app_version', '1.0.0', 'string', 'Application version', 1),
  ('max_file_size', '10485760', 'number', 'Maximum file upload size in bytes', 0),
  ('allowed_file_types', 'pdf,doc,docx,jpg,jpeg,png,gif,txt', 'string', 'Allowed file types for upload', 0),
  ('backup_retention_days', '30', 'number', 'Number of days to retain backups', 0),
  ('notification_email_enabled', 'true', 'boolean', 'Enable email notifications', 0),
  ('notification_sms_enabled', 'false', 'boolean', 'Enable SMS notifications', 0),
  ('audit_log_retention_days', '365', 'number', 'Number of days to retain audit logs', 0),
  ('default_dispute_timeline', '30', 'number', 'Default dispute timeline in days', 0),
  ('credit_score_monitoring_enabled', 'true', 'boolean', 'Enable credit score monitoring', 0);
`;

// Default admin user
const defaultAdmin = `
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'admin@rickjeffersonsolutions.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'admin123'
  'Rick',
  'Jefferson',
  'admin',
  1,
  1
);
`;

async function setupDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Setting up SQLite database for Rick Jefferson Solutions Credit Platform...');
    
    db.serialize(() => {
      // Create schema
      db.exec(schema, (err) => {
        if (err) {
          console.error('❌ Error creating schema:', err);
          reject(err);
          return;
        }
        console.log('✅ Database schema created successfully');
        
        // Insert default settings
        db.exec(defaultSettings, (err) => {
          if (err) {
            console.error('❌ Error inserting default settings:', err);
            reject(err);
            return;
          }
          console.log('✅ Default settings inserted');
          
          // Insert default admin user
          db.exec(defaultAdmin, (err) => {
            if (err) {
              console.error('❌ Error creating admin user:', err);
              reject(err);
              return;
            }
            console.log('✅ Default admin user created (admin@rickjeffersonsolutions.com / admin123)');
            console.log('🎉 Database setup complete!');
            console.log(`📍 Database location: ${path.resolve(dbPath)}`);
            
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err);
                reject(err);
              } else {
                console.log('✅ Database connection closed');
                resolve();
              }
            });
          });
        });
      });
    });
  });
}

if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };