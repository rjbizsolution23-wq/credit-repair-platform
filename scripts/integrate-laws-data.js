const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration for initial connection (without database name)
const adminConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
};

// Database configuration for application connection
const dbConfig = {
  ...adminConfig,
  database: process.env.DB_NAME || 'credit_repair_platform',
};

const pool = new Pool(dbConfig);

async function createDatabaseIfNotExists() {
  const adminClient = new Client(adminConfig);
  try {
    await adminClient.connect();
    
    // Check if database exists
    const result = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'credit_repair_platform']
    );
    
    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await adminClient.query(`CREATE DATABASE ${process.env.DB_NAME || 'credit_repair_platform'}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}

async function executeSQLFile(filePath) {
  const client = await pool.connect();
  try {
    console.log(`Executing SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('\\i'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}`);
          await client.query(statement);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 200) + '...');
          // Continue with next statement instead of failing completely
        }
      }
    }
    
    console.log('SQL file execution completed');
  } catch (error) {
    console.error('Error reading or executing SQL file:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function integrateExpandedCreditLaws() {
  const client = await pool.connect();
  try {
    console.log('Starting comprehensive credit laws integration...');
    
    // First, create the expanded tables and data
    const expandedLawsSQL = `
    -- =====================================================
    -- EXPANDED CREDIT LAWS INTEGRATION
    -- =====================================================
    
    -- Expand laws_regulations table with additional columns
    ALTER TABLE laws_regulations 
    ADD COLUMN IF NOT EXISTS jurisdiction_level VARCHAR(50),
    ADD COLUMN IF NOT EXISTS compliance_requirements TEXT[],
    ADD COLUMN IF NOT EXISTS related_laws TEXT[],
    ADD COLUMN IF NOT EXISTS last_updated DATE DEFAULT CURRENT_DATE;
    
    -- Create comprehensive law categories table
    CREATE TABLE IF NOT EXISTS comprehensive_law_categories (
        id SERIAL PRIMARY KEY,
        category_name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        jurisdiction_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create credit industry entities table
    CREATE TABLE IF NOT EXISTS credit_industry_entities (
        id SERIAL PRIMARY KEY,
        legal_name VARCHAR(255) NOT NULL,
        dba VARCHAR(255),
        parent_company VARCHAR(255),
        entity_type VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        license_state VARCHAR(2),
        address_1 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(2),
        zip VARCHAR(10),
        country VARCHAR(3) DEFAULT 'USA',
        phone_primary VARCHAR(20),
        website VARCHAR(255),
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create data sources table
    CREATE TABLE IF NOT EXISTS data_sources (
        id SERIAL PRIMARY KEY,
        source_name VARCHAR(255) NOT NULL,
        source_type VARCHAR(100),
        description TEXT,
        url VARCHAR(500),
        jurisdiction VARCHAR(100),
        last_updated DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create compliance requirements table
    CREATE TABLE IF NOT EXISTS compliance_requirements (
        id SERIAL PRIMARY KEY,
        law_id INTEGER REFERENCES laws_regulations(id),
        requirement_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        penalty_for_violation TEXT,
        enforcement_mechanism TEXT,
        is_mandatory BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create state regulations table
    CREATE TABLE IF NOT EXISTS state_regulations (
        id SERIAL PRIMARY KEY,
        state VARCHAR(2) NOT NULL,
        regulation_type VARCHAR(100) NOT NULL,
        description TEXT,
        citation VARCHAR(255),
        licensing_required BOOLEAN DEFAULT FALSE,
        disclosure_required BOOLEAN DEFAULT FALSE,
        statute_of_limitations_years INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Insert comprehensive law categories
    INSERT INTO comprehensive_law_categories (category_name, description, jurisdiction_level) VALUES
    ('Federal Credit Laws', 'Federal laws governing credit reporting and debt collection', 'Federal'),
    ('State Credit Laws', 'State-specific credit and debt collection regulations', 'State'),
    ('Consumer Protection Laws', 'Laws protecting consumers in financial transactions', 'Multi-Jurisdictional'),
    ('Telemarketing Laws', 'Laws governing telemarketing and robocalls', 'Federal'),
    ('Privacy Laws', 'Laws protecting consumer financial privacy', 'Multi-Jurisdictional'),
    ('Real Estate Disclosure Laws', 'Laws requiring disclosure of property conditions', 'Multi-Jurisdictional'),
    ('Mortgage and Lending Laws', 'Laws governing mortgage lending and financing', 'Multi-Jurisdictional'),
    ('Tax Laws Affecting Credit', 'Tax laws that impact credit reporting and debt collection', 'Multi-Jurisdictional')
    ON CONFLICT (category_name) DO NOTHING;
    `;
    
    console.log('Creating expanded tables and categories...');
    await client.query(expandedLawsSQL);
    
    // Insert major federal credit laws
    const federalLawsSQL = `
    -- Insert comprehensive federal credit laws
    INSERT INTO laws_regulations (law_name, category_id, citation, summary, full_text, jurisdiction_level, enforcement_agency, penalties, compliance_requirements, related_laws) VALUES
    
    ('Fair Credit Reporting Act (FCRA)',
     (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Federal Credit Laws'),
     '15 U.S.C. § 1681 et seq.',
     'Federal law governing the collection, dissemination, and use of consumer credit information',
     'The Fair Credit Reporting Act (FCRA) is designed to promote accuracy, fairness, and privacy of consumer information contained in the files of consumer reporting agencies. Key provisions include: (1) Right to know what is in your credit file, (2) Right to dispute inaccurate information, (3) Right to have outdated negative information removed, (4) Consent required for credit reports, (5) Limits on who can access credit reports, (6) Notice required when credit reports are used against consumers.',
     'Federal',
     'Consumer Financial Protection Bureau (CFPB)',
     'Actual damages, statutory damages up to $1,000, punitive damages, attorney fees',
     ARRAY['Accuracy procedures','Dispute investigation','Adverse action notices','Permissible purpose verification'],
     ARRAY['FDCPA','ECOA','FACTA']),
    
    ('Fair Debt Collection Practices Act (FDCPA)',
     (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Federal Credit Laws'),
     '15 U.S.C. § 1692 et seq.',
     'Federal law regulating debt collection practices and protecting consumers from abusive debt collectors',
     'The Fair Debt Collection Practices Act (FDCPA) prohibits debt collectors from using abusive, unfair, or deceptive practices to collect debts. Key provisions include: (1) Prohibition of harassment or abuse, (2) Prohibition of false or misleading representations, (3) Prohibition of unfair practices, (4) Required disclosures and validation notices, (5) Time, place, and manner restrictions on communications, (6) Right to dispute debts and request validation.',
     'Federal',
     'Consumer Financial Protection Bureau (CFPB)',
     'Actual damages, statutory damages up to $1,000, attorney fees and costs',
     ARRAY['Initial disclosure requirements','Validation notice within 5 days','Communication restrictions','Cease communication upon request'],
     ARRAY['FCRA','State debt collection laws','TCPA']),
    
    ('Equal Credit Opportunity Act (ECOA)',
     (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Federal Credit Laws'),
     '15 U.S.C. § 1691 et seq.',
     'Federal law prohibiting credit discrimination based on protected characteristics',
     'The Equal Credit Opportunity Act (ECOA) makes it unlawful for any creditor to discriminate against any applicant on the basis of race, color, religion, national origin, sex, marital status, age, or because income derives from public assistance. Key provisions include: (1) Prohibition of discriminatory practices, (2) Required adverse action notices, (3) Right to know reasons for credit denial, (4) Spousal signature limitations, (5) Credit history requirements for married applicants.',
     'Federal',
     'Consumer Financial Protection Bureau (CFPB)',
     'Actual and punitive damages, attorney fees, equitable relief',
     ARRAY['Non-discriminatory lending practices','Adverse action notice requirements','Spousal signature limitations','Credit history preservation'],
     ARRAY['Fair Housing Act','FCRA','HMDA'])
    ON CONFLICT (law_name) DO NOTHING;
    `;
    
    console.log('Inserting federal credit laws...');
    await client.query(federalLawsSQL);
    
    // Insert major credit industry entities
    const entitiesSQL = `
    -- Insert major credit industry entities
    INSERT INTO credit_industry_entities (legal_name, dba, parent_company, entity_type, category, license_state, address_1, city, state, zip, country, phone_primary, website, notes) VALUES
    
    -- Major Credit Reporting Agencies
    ('Experian Information Solutions, Inc.', 'Experian', 'Experian plc', 'Credit Reporting Agency', 'Major CRA', 'CA', '475 Anton Blvd', 'Costa Mesa', 'CA', '92626', 'USA', '1-888-397-3742', 'experian.com', 'One of the three major credit reporting agencies'),
    ('Equifax Information Services LLC', 'Equifax', 'Equifax Inc.', 'Credit Reporting Agency', 'Major CRA', 'GA', '1550 Peachtree St NW', 'Atlanta', 'GA', '30309', 'USA', '1-800-685-1111', 'equifax.com', 'One of the three major credit reporting agencies'),
    ('Trans Union LLC', 'TransUnion', 'TransUnion', 'Credit Reporting Agency', 'Major CRA', 'IL', '555 W Adams St', 'Chicago', 'IL', '60661', 'USA', '1-800-916-8800', 'transunion.com', 'One of the three major credit reporting agencies'),
    
    -- Major Debt Collectors
    ('Portfolio Recovery Associates, LLC', 'PRA', 'PRA Group Inc.', 'Debt Collector', 'Consumer Debt Collection', 'VA', '120 Corporate Blvd', 'Norfolk', 'VA', '23502', 'USA', '1-800-772-1413', 'portfoliorecovery.com', 'Major debt buyer and collector'),
    ('Midland Credit Management, Inc.', 'MCM', 'Encore Capital Group', 'Debt Collector', 'Consumer Debt Collection', 'CA', '350 Camino De La Reina', 'San Diego', 'CA', '92108', 'USA', '1-800-296-2657', 'midlandcreditonline.com', 'Large debt collection agency'),
    
    -- Specialty Credit Reporting Agencies
    ('Innovis Data Solutions, Inc.', 'Innovis', '', 'Specialty CRA', 'Alternative Credit Data', 'OH', '1 Innovis Way', 'Columbus', 'OH', '43240', 'USA', '1-800-540-2505', 'innovis.com', 'Fourth major credit reporting agency'),
    ('LexisNexis Risk Solutions Inc.', 'LexisNexis', 'RELX Group', 'Specialty CRA', 'Identity and Risk Data', 'GA', '1000 Alderman Dr', 'Alpharetta', 'GA', '30005', 'USA', '1-866-897-8126', 'risk.lexisnexis.com', 'Comprehensive consumer data and analytics'),
    ('Chex Systems, Inc.', 'ChexSystems', 'Fidelity National Information Services', 'Specialty CRA', 'Banking and Check Verification', 'MN', '7805 Hudson Rd', 'Woodbury', 'MN', '55125', 'USA', '1-800-428-9623', 'chexsystems.com', 'Banking history and check verification')
    ON CONFLICT (legal_name) DO NOTHING;
    `;
    
    console.log('Inserting credit industry entities...');
    await client.query(entitiesSQL);
    
    // Insert data sources
    const dataSourcesSQL = `
    -- Insert comprehensive data sources
    INSERT INTO data_sources (source_name, source_type, description, url, jurisdiction, last_updated, is_active) VALUES
    ('Consumer Financial Protection Bureau', 'Federal Registry', 'Federal agency overseeing consumer financial protection', 'https://www.consumerfinance.gov', 'US-federal', CURRENT_DATE, TRUE),
    ('Federal Trade Commission', 'Federal Registry', 'Federal agency enforcing consumer protection laws', 'https://www.ftc.gov', 'US-federal', CURRENT_DATE, TRUE),
    ('National Association of Consumer Credit Administrators', 'Industry Association', 'State credit regulators association', 'https://www.nacca.net', 'Multi-state', CURRENT_DATE, TRUE),
    ('American Collectors Association', 'Industry Association', 'Debt collection industry association', 'https://www.acainternational.org', 'US-federal', CURRENT_DATE, TRUE),
    ('Consumer Data Industry Association', 'Industry Association', 'Credit reporting industry association', 'https://www.cdiaonline.org', 'US-federal', CURRENT_DATE, TRUE)
    ON CONFLICT (source_name) DO NOTHING;
    `;
    
    console.log('Inserting data sources...');
    await client.query(dataSourcesSQL);
    
    console.log('Comprehensive credit laws integration completed successfully!');
    
  } catch (error) {
    console.error('Error during credit laws integration:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('Starting comprehensive laws and data integration...');
    console.log('Database configuration:');
    console.log(`- Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`- Port: ${process.env.DB_PORT || 5432}`);
    console.log(`- Database: ${process.env.DB_NAME || 'credit_repair_platform'}`);
    console.log(`- User: ${process.env.DB_USER || 'postgres'}`);
    
    // First, create the database if it doesn't exist
    await createDatabaseIfNotExists();
    
    // Test database connection
    const client = await pool.connect();
    console.log('Database connection successful!');
    client.release();
    
    // Execute the comprehensive integration
    await integrateExpandedCreditLaws();
    
    console.log('\n=== INTEGRATION SUMMARY ===');
    console.log('✅ Expanded laws_regulations table with additional columns');
    console.log('✅ Created comprehensive_law_categories table');
    console.log('✅ Created credit_industry_entities table');
    console.log('✅ Created data_sources table');
    console.log('✅ Created compliance_requirements table');
    console.log('✅ Created state_regulations table');
    console.log('✅ Inserted federal credit laws (FCRA, FDCPA, ECOA)');
    console.log('✅ Inserted major credit industry entities');
    console.log('✅ Inserted comprehensive data sources');
    console.log('\nThe Rick Jefferson AI Credit Platform now has a comprehensive');
    console.log('legal framework with all major credit-related laws and industry data!');
    
  } catch (error) {
    console.error('Integration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the integration
if (require.main === module) {
  main();
}

module.exports = { integrateExpandedCreditLaws, executeSQLFile };