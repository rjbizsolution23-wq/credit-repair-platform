const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

class DatabaseManager {
  constructor() {
    this.dbType = process.env.DB_TYPE || 'postgresql';
    this.connection = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return this.connection;
    }

    try {
      if (this.dbType === 'sqlite') {
        await this.initializeSQLite();
      } else {
        await this.initializePostgreSQL();
      }
      this.isInitialized = true;
      console.log(`Database initialized successfully (${this.dbType})`);
      return this.connection;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async initializeSQLite() {
    const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || './database/credit_repair_platform.db';
    const fullPath = path.resolve(dbPath);
    
    // Ensure directory exists
    const fs = require('fs');
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.connection = await open({
      filename: fullPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await this.connection.exec('PRAGMA foreign_keys = ON');
  }

  async initializePostgreSQL() {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'credit_repair_platform',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.connection = new Pool(config);
    
    // Test connection
    const client = await this.connection.connect();
    await client.query('SELECT NOW()');
    client.release();
  }

  async query(text, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.dbType === 'sqlite') {
      // Convert PostgreSQL-style queries to SQLite
      const sqliteQuery = this.convertToSQLite(text, params);
      if (text.trim().toLowerCase().startsWith('select')) {
        return { rows: await this.connection.all(sqliteQuery.text, sqliteQuery.params) };
      } else {
        const result = await this.connection.run(sqliteQuery.text, sqliteQuery.params);
        return { 
          rows: [], 
          rowCount: result.changes,
          insertId: result.lastID 
        };
      }
    } else {
      return await this.connection.query(text, params);
    }
  }

  convertToSQLite(query, params) {
    // Convert PostgreSQL $1, $2, etc. to SQLite ? placeholders
    let sqliteQuery = query;
    let sqliteParams = [...params];

    // Replace PostgreSQL parameter placeholders with SQLite ones
    sqliteQuery = sqliteQuery.replace(/\$\d+/g, '?');

    // Handle some common PostgreSQL to SQLite conversions
    sqliteQuery = sqliteQuery.replace(/RETURNING \*/g, '');
    sqliteQuery = sqliteQuery.replace(/RETURNING id/g, '');
    sqliteQuery = sqliteQuery.replace(/NOW\(\)/g, "datetime('now')");
    sqliteQuery = sqliteQuery.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");
    sqliteQuery = sqliteQuery.replace(/SERIAL/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    sqliteQuery = sqliteQuery.replace(/BOOLEAN/g, 'INTEGER');
    sqliteQuery = sqliteQuery.replace(/TEXT\[\]/g, 'TEXT');
    sqliteQuery = sqliteQuery.replace(/JSONB/g, 'TEXT');
    sqliteQuery = sqliteQuery.replace(/JSON/g, 'TEXT');
    
    return { text: sqliteQuery, params: sqliteParams };
  }

  async getClient() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.dbType === 'sqlite') {
      // For SQLite, return a wrapper that mimics PostgreSQL client
      return {
        query: this.query.bind(this),
        release: () => {}, // No-op for SQLite
      };
    } else {
      return await this.connection.connect();
    }
  }

  async close() {
    if (this.connection) {
      if (this.dbType === 'sqlite') {
        await this.connection.close();
      } else {
        await this.connection.end();
      }
      this.isInitialized = false;
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Export both the manager and a pool-like interface for backward compatibility
module.exports = {
  dbManager,
  // Backward compatibility - acts like a PostgreSQL pool
  query: (text, params) => dbManager.query(text, params),
  connect: () => dbManager.getClient(),
  end: () => dbManager.close()
};