-- =====================================================
-- EXPANDED CREDIT LAWS AND DATA INTEGRATION
-- Comprehensive integration of all credit-related laws and data
-- from arxiv-harvest-project into the Rick Jefferson AI Credit Platform
-- =====================================================

-- First, let's expand the existing laws_regulations table structure
ALTER TABLE laws_regulations ADD COLUMN IF NOT EXISTS jurisdiction_level VARCHAR(50);
ALTER TABLE laws_regulations ADD COLUMN IF NOT EXISTS compliance_requirements TEXT[];
ALTER TABLE laws_regulations ADD COLUMN IF NOT EXISTS penalties TEXT;
ALTER TABLE laws_regulations ADD COLUMN IF NOT EXISTS enforcement_agency VARCHAR(255);
ALTER TABLE laws_regulations ADD COLUMN IF NOT EXISTS last_updated_date DATE;
ALTER TABLE laws_regulations ADD COLUMN IF NOT EXISTS related_laws TEXT[];

-- Create comprehensive credit industry entities table
CREATE TABLE IF NOT EXISTS credit_industry_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name VARCHAR(500) NOT NULL,
    dba VARCHAR(255),
    parent_company VARCHAR(255),
    entity_type VARCHAR(100) CHECK (entity_type IN ('Debt Collector','Credit Reporting Agency','Specialty CRA','Data Furnisher','Debt Buyer','Law Firm','Credit Repair Company','Financial Institution')) NOT NULL,
    category VARCHAR(255),
    license_state VARCHAR(10),
    license_number VARCHAR(100),
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(10),
    zip VARCHAR(20),
    country VARCHAR(50) DEFAULT 'USA',
    phone_primary VARCHAR(20),
    phone_alt VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    notes TEXT,
    source_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data sources registry table
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) CHECK (source_type IN ('Federal Registry','State Registry','Industry Association','Government Database','Legal Database')) NOT NULL,
    jurisdiction VARCHAR(100),
    description TEXT,
    website VARCHAR(255),
    api_endpoint VARCHAR(255),
    update_frequency VARCHAR(50),
    last_updated TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive law categories table
CREATE TABLE IF NOT EXISTS comprehensive_law_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    jurisdiction_level VARCHAR(50) CHECK (jurisdiction_level IN ('Federal','State','Local','Multi-Jurisdictional')) NOT NULL,
    parent_category_id UUID REFERENCES comprehensive_law_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create compliance requirements table
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_id UUID REFERENCES laws_regulations(id) ON DELETE CASCADE,
    requirement_type VARCHAR(100),
    description TEXT,
    penalty_for_violation TEXT,
    enforcement_mechanism TEXT,
    compliance_deadline DATE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create state regulations table for jurisdiction-specific laws
CREATE TABLE IF NOT EXISTS state_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(50) NOT NULL,
    regulation_type VARCHAR(100),
    description TEXT,
    citation VARCHAR(200),
    effective_date DATE,
    licensing_required BOOLEAN DEFAULT FALSE,
    disclosure_required BOOLEAN DEFAULT FALSE,
    statute_of_limitations_years INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert comprehensive law categories
INSERT INTO comprehensive_law_categories (category_name, description, jurisdiction_level) VALUES
('Federal Credit Laws', 'Primary federal legislation governing credit reporting and debt collection', 'Federal'),
('State Credit Laws', 'State-specific credit and debt collection regulations', 'State'),
('Consumer Protection Laws', 'Laws protecting consumers in financial transactions', 'Multi-Jurisdictional'),
('Fair Housing and Civil Rights', 'Anti-discrimination laws in housing and credit', 'Federal'),
('Telemarketing and Communication Laws', 'Regulations governing debt collection communications', 'Federal'),
('Banking and Financial Services Laws', 'Laws governing financial institutions and services', 'Federal'),
('Real Estate and Mortgage Laws', 'Laws governing real estate transactions and mortgage lending', 'Multi-Jurisdictional'),
('Privacy and Data Protection Laws', 'Laws governing personal data collection and use', 'Multi-Jurisdictional'),
('Bankruptcy and Insolvency Laws', 'Laws governing bankruptcy proceedings and debt discharge', 'Federal'),
('Identity Theft and Fraud Laws', 'Laws addressing identity theft and financial fraud', 'Multi-Jurisdictional');

-- Insert comprehensive federal credit laws
INSERT INTO laws_regulations (law_name, category_id, citation, summary, full_text, jurisdiction_level, enforcement_agency, penalties, compliance_requirements, related_laws) VALUES

-- FCRA Comprehensive Entry
('Fair Credit Reporting Act (FCRA)', 
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Federal Credit Laws'),
 '15 U.S.C. § 1681 et seq.',
 'Comprehensive federal law governing the collection, dissemination, and use of consumer credit information',
 'The Fair Credit Reporting Act (FCRA) is a federal law that regulates the collection, dissemination, and use of consumer information, including consumer credit information. The FCRA governs credit reporting agencies, users of credit reports, and furnishers of information to credit reporting agencies. Key provisions include: (1) Permissible purposes for obtaining credit reports, (2) Consumer rights to access and dispute credit information, (3) Obligations of credit reporting agencies to maintain accurate information, (4) Requirements for furnishers of information, (5) Procedures for investigating disputes, (6) Disclosure requirements for adverse actions, (7) Identity theft protections, (8) Medical information restrictions.',
 'Federal',
 'Consumer Financial Protection Bureau (CFPB)',
 'Actual damages, statutory damages up to $1,000 per violation, punitive damages for willful violations, attorney fees and costs',
 ARRAY['Reasonable procedures to ensure maximum possible accuracy','Reinvestigation of disputed information within 30 days','Disclosure of credit scores when used in adverse actions','Identity theft victim protections'],
 ARRAY['FDCPA','ECOA','FACTA']),

-- FDCPA Comprehensive Entry
('Fair Debt Collection Practices Act (FDCPA)',
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Federal Credit Laws'),
 '15 U.S.C. § 1692 et seq.',
 'Federal law regulating debt collection practices and protecting consumers from abusive debt collection',
 'The Fair Debt Collection Practices Act (FDCPA) prohibits debt collectors from using abusive, unfair, or deceptive practices to collect debts. The law covers personal, family, and household debts, including credit card debt, auto loans, medical bills, and mortgages. Key provisions include: (1) Prohibition of harassment, oppression, or abuse, (2) Prohibition of false or misleading representations, (3) Prohibition of unfair practices, (4) Required disclosures in initial communications, (5) Validation of debt requirements, (6) Restrictions on communication times and methods, (7) Cease communication rights, (8) Dispute procedures.',
 'Federal',
 'Consumer Financial Protection Bureau (CFPB)',
 'Actual damages, statutory damages up to $1,000 per violation, attorney fees and costs',
 ARRAY['Initial disclosure of debt information','Validation notice within 5 days of initial communication','Cease communication upon written request','No contact at inconvenient times or places'],
 ARRAY['FCRA','TCPA','State debt collection laws']),

-- ECOA Comprehensive Entry
('Equal Credit Opportunity Act (ECOA)',
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Fair Housing and Civil Rights'),
 '15 U.S.C. § 1691 et seq.',
 'Federal law prohibiting discrimination in credit transactions',
 'The Equal Credit Opportunity Act (ECOA) makes it unlawful for any creditor to discriminate against any applicant with respect to any aspect of a credit transaction on the basis of race, color, religion, national origin, sex, marital status, age, or because the applicant receives public assistance. Key provisions include: (1) Prohibited bases for discrimination, (2) Required adverse action notices, (3) Spousal signature limitations, (4) Credit history considerations, (5) Income evaluation requirements, (6) Record retention requirements.',
 'Federal',
 'Consumer Financial Protection Bureau (CFPB)',
 'Actual damages, punitive damages up to $10,000, attorney fees and costs',
 ARRAY['Adverse action notices within 30 days','Specific reasons for credit denial','Equal consideration of all income sources','Prohibition of discriminatory credit terms'],
 ARRAY['Fair Housing Act','FCRA','Truth in Lending Act']),

-- TCPA Entry
('Telephone Consumer Protection Act (TCPA)',
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Telemarketing and Communication Laws'),
 '47 U.S.C. § 227',
 'Federal law restricting telemarketing calls and automated communications',
 'The Telephone Consumer Protection Act (TCPA) restricts telephone solicitations and the use of automated telephone equipment. Key provisions affecting debt collection include: (1) Prior express written consent requirements for autodialed calls to cell phones, (2) Restrictions on prerecorded messages, (3) Time restrictions on calls, (4) Do Not Call Registry compliance, (5) Identification requirements for callers, (6) Opt-out mechanisms for automated calls.',
 'Federal',
 'Federal Communications Commission (FCC)',
 '$500-$1,500 per violation, treble damages for willful violations',
 ARRAY['Prior express written consent for autodialed calls','Compliance with Do Not Call Registry','Time restrictions (8 AM - 9 PM)','Caller identification requirements'],
 ARRAY['FDCPA','Telemarketing Sales Rule','State telemarketing laws']),

-- FACTA Entry
('Fair and Accurate Credit Transactions Act (FACTA)',
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Federal Credit Laws'),
 'Pub. L. 108-159',
 'Amendment to FCRA providing additional consumer protections and identity theft provisions',
 'The Fair and Accurate Credit Transactions Act (FACTA) amended the FCRA to provide consumers with additional protections against identity theft and to improve the accuracy of credit reports. Key provisions include: (1) Free annual credit reports, (2) Fraud alerts and security freezes, (3) Identity theft victim protections, (4) Red Flags Rule for financial institutions, (5) Disposal Rule for consumer information, (6) Medical information restrictions, (7) Risk-based pricing notices.',
 'Federal',
 'Consumer Financial Protection Bureau (CFPB)',
 'Same as FCRA violations',
 ARRAY['Free annual credit reports','Identity theft victim protections','Red Flags Rule compliance','Proper disposal of consumer information'],
 ARRAY['FCRA','Identity Theft and Assumption Deterrence Act']),

-- Truth in Lending Act
('Truth in Lending Act (TILA)',
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Banking and Financial Services Laws'),
 '15 U.S.C. § 1601 et seq.',
 'Federal law requiring disclosure of credit terms and costs',
 'The Truth in Lending Act (TILA) requires creditors to disclose key terms and costs of credit agreements to enable consumers to comparison shop. Key provisions include: (1) Annual Percentage Rate (APR) disclosures, (2) Finance charge calculations, (3) Right of rescission for certain transactions, (4) Credit card protections, (5) Mortgage disclosure requirements, (6) Advertising restrictions.',
 'Federal',
 'Consumer Financial Protection Bureau (CFPB)',
 'Actual damages, statutory damages, attorney fees and costs',
 ARRAY['APR and finance charge disclosures','Right of rescission notices','Credit card statement requirements','Mortgage disclosure timing'],
 ARRAY['RESPA','ECOA','Credit CARD Act']),

-- Real Estate Settlement Procedures Act
('Real Estate Settlement Procedures Act (RESPA)',
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Real Estate and Mortgage Laws'),
 '12 U.S.C. § 2601 et seq.',
 'Federal law governing real estate settlement procedures and mortgage servicing',
 'The Real Estate Settlement Procedures Act (RESPA) requires settlement cost disclosures and prohibits kickbacks in real estate transactions. Key provisions include: (1) Good Faith Estimate requirements, (2) HUD-1 Settlement Statement, (3) Prohibition of kickbacks and referral fees, (4) Servicing transfer notices, (5) Escrow account limitations, (6) Error resolution procedures.',
 'Federal',
 'Consumer Financial Protection Bureau (CFPB)',
 'Treble damages for kickback violations, actual damages for other violations',
 ARRAY['Settlement cost disclosures','Prohibition of kickbacks','Servicing transfer notices','Escrow account management'],
 ARRAY['TILA','Fair Housing Act','HMDA']),

-- Gramm-Leach-Bliley Act
('Gramm-Leach-Bliley Act (GLBA)',
 (SELECT id FROM comprehensive_law_categories WHERE category_name = 'Privacy and Data Protection Laws'),
 '15 U.S.C. § 6801 et seq.',
 'Federal law governing financial privacy and data security',
 'The Gramm-Leach-Bliley Act (GLBA) requires financial institutions to explain their information-sharing practices and to safeguard sensitive data. Key provisions include: (1) Privacy notices to customers, (2) Opt-out rights for information sharing, (3) Safeguards Rule for data security, (4) Pretexting prohibitions, (5) Affiliate marketing restrictions.',
 'Federal',
 'Multiple agencies (FTC, banking regulators)',
 'Civil penalties up to $100,000 per violation, criminal penalties for pretexting',
 ARRAY['Annual privacy notices','Opt-out mechanisms','Information security programs','Pretexting prohibitions'],
 ARRAY['FCRA','FACTA','State privacy laws']);

-- Insert credit industry entities from CSV data
INSERT INTO credit_industry_entities (legal_name, dba, parent_company, entity_type, category, license_state, license_number, address_1, address_2, city, state, zip, country, phone_primary, phone_alt, email, website, notes, source_url) VALUES
('Portfolio Recovery Associates, LLC', 'PRA Group', 'PRA Group', 'Debt Collector', 'Consumer Debt Collection', 'VA', '', '120 Corporate Blvd', '', 'Norfolk', 'VA', '23502', 'USA', '1-800-772-1413', '', '', 'portfoliorecovery.com', 'Customer care line, IR contact available', 'https://www.portfoliorecovery.com/prapay'),
('Midland Credit Management', 'MCM', 'Encore Capital', 'Debt Collector', 'Consumer Debt Collection', 'CA', '', 'PO Box 939069', '', 'San Diego', 'CA', '92193', 'USA', '1-800-296-2657', '', '', 'midlandcredit.com', 'Encore family includes Midland Funding, Atlantic Credit & Finance', 'https://www.midlandcredit.com/'),
('Jefferson Capital Systems, LLC', 'JCAP', '', 'Debt Collector', 'Consumer Debt Collection', 'MN', '', '200 14th Ave E', '', 'Sartell', 'MN', '56377', 'USA', '1-833-851-5552', '', '', 'jcap.com', 'Consumer debt collection services', 'https://www.jcap.com/contact-us/access-your-account'),
('Resurgent Capital Services', 'RCS', '', 'Debt Collector', 'Debt Servicing', 'SC', '', 'PO Box 10497', '', 'Greenville', 'SC', '29603', 'USA', '1-888-665-0374', '', '', 'resurgent.com', 'Servicer for LVNV Funding and others', 'https://portal.resurgent.com/guest/contact'),
('LVNV Funding LLC', 'LVNV', '', 'Debt Buyer', 'Debt Purchasing', 'SC', '', 'c/o Resurgent Capital Services, PO Box 10497', '', 'Greenville', 'SC', '29603', 'USA', '1-866-453-0039', '', '', 'lvnvfunding.com', 'Serviced via Resurgent Capital Services', 'https://www.lvnvfunding.com/lvnv/ccpa'),
('Transworld Systems Inc.', 'TSI', '', 'Debt Collector', 'Consumer Debt Collection', 'PA', '', '500 Virginia Dr', 'Suite 514', 'Fort Washington', 'PA', '19034', 'USA', '1-800-456-4729', '888-899-6650', '', 'tsico.com', 'Consumer and business contact lines available', 'https://myaccount.tsico.com/EmailPolicy/ContactUs.html'),
('IC System, Inc.', 'ICS', '', 'Debt Collector', 'Medical and Consumer Debt Collection', '', '', '', '', '', '', '', 'USA', '866-628-7811', '800-279-7244', '', 'icsystem.com', 'Medical debt: 866-628-7811, Other debt: 800-279-7244, Business: 800-279-3511', 'https://www.icsystem.com/consumer/'),
('Convergent Outsourcing, Inc.', 'COI', '', 'Debt Collector', 'Consumer Debt Collection', 'WA', '', '800 SW 39th St', 'Ste 100', 'Renton', 'WA', '98057', 'USA', '800-444-8485', '', '', '', 'Common consumer phone, additional numbers on BBB', 'https://www.bbb.org/us/wa/renton/profile/collections-agencies/convergent-outsourcing-inc-1126-18001562'),
('Enhanced Recovery Company', 'ERC', '', 'Debt Collector', 'Consumer Debt Collection', 'FL', '', '8014 Bayberry Rd', '', 'Jacksonville', 'FL', '32256', 'USA', '855-347-2780', '904-733-9042', '', 'ercglobalcx.com', 'Office footprint has shifted, verify active lines when contacting', 'https://ercglobalcx.com/'),
('ChexSystems', '', 'Early Warning Services', 'Specialty CRA', 'Check Verification', '', '', '', '', '', '', '', 'USA', '', '', '', 'chexsystems.com', 'Banking and check verification micro-bureau', 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/'),
('TeleCheck', '', 'First Data Corporation', 'Specialty CRA', 'Check Verification', '', '', '', '', '', '', '', 'USA', '', '', '', 'telecheck.com', 'Check verification services', 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/'),
('Early Warning Services', 'EWS', '', 'Specialty CRA', 'Banking Data', '', '', '', '', '', '', '', 'USA', '', '', '', 'earlywarning.com', 'Banking data and fraud prevention', 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/'),
('LexisNexis Risk Solutions', '', 'RELX Group', 'Specialty CRA', 'Identity Verification', '', '', '', '', '', '', '', 'USA', '', '', '', 'risk.lexisnexis.com', 'Identity verification and risk assessment', 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/'),
('PRBC', 'Payment Reporting Builds Credit', '', 'Specialty CRA', 'Alternative Credit Data', '', '', '', '', '', '', '', 'USA', '', '', '', 'prbc.com', 'Alternative credit reporting for rent, utilities, etc.', 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/'),
('SageStream', '', 'SageStream LLC', 'Specialty CRA', 'Alternative Credit Data', '', '', '', '', '', '', '', 'USA', '', '', '', 'sagestream.com', 'Alternative credit and identity verification', 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/'),
('Clarity Services', '', 'Clarity Services Inc.', 'Specialty CRA', 'Subprime Credit Reporting', '', '', '', '', '', '', '', 'USA', '', '', '', 'clarityservices.com', 'Subprime and alternative credit reporting', 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/');

-- Insert data sources
INSERT INTO data_sources (source_name, source_type, jurisdiction, description, website, update_frequency) VALUES
('Consumer Financial Protection Bureau (CFPB)', 'Federal Registry', 'Federal', 'Primary federal agency for consumer financial protection', 'https://www.consumerfinance.gov/', 'Daily'),
('Federal Trade Commission (FTC)', 'Federal Registry', 'Federal', 'Federal agency enforcing consumer protection laws', 'https://www.ftc.gov/', 'Daily'),
('Office of the Comptroller of the Currency (OCC)', 'Federal Registry', 'Federal', 'Federal banking regulator', 'https://www.occ.gov/', 'Weekly'),
('Federal Deposit Insurance Corporation (FDIC)', 'Federal Registry', 'Federal', 'Federal deposit insurance and bank regulation', 'https://www.fdic.gov/', 'Weekly'),
('National Association of Attorneys General (NAAG)', 'Industry Association', 'Multi-State', 'Association of state attorneys general', 'https://www.naag.org/', 'Monthly'),
('Conference of State Bank Supervisors (CSBS)', 'Industry Association', 'Multi-State', 'Association of state banking regulators', 'https://www.csbs.org/', 'Monthly'),
('American Collectors Association (ACA)', 'Industry Association', 'National', 'Trade association for debt collection industry', 'https://www.acainternational.org/', 'Monthly'),
('Consumer Data Industry Association (CDIA)', 'Industry Association', 'National', 'Trade association for credit reporting industry', 'https://www.cdiaonline.org/', 'Monthly');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_entities_type ON credit_industry_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_credit_entities_state ON credit_industry_entities(state);
CREATE INDEX IF NOT EXISTS idx_credit_entities_active ON credit_industry_entities(is_active);
CREATE INDEX IF NOT EXISTS idx_laws_category ON laws_regulations(category_id);
CREATE INDEX IF NOT EXISTS idx_laws_jurisdiction ON laws_regulations(jurisdiction_level);
CREATE INDEX IF NOT EXISTS idx_compliance_law ON compliance_requirements(law_id);

-- Create views for easy access to comprehensive data
CREATE OR REPLACE VIEW comprehensive_credit_laws AS
SELECT 
    lr.id,
    lr.law_name,
    clc.category_name,
    lr.citation,
    lr.summary,
    lr.jurisdiction_level,
    lr.enforcement_agency,
    lr.penalties,
    lr.compliance_requirements,
    lr.related_laws,
    lr.created_at
FROM laws_regulations lr
JOIN comprehensive_law_categories clc ON lr.category_id = clc.id
WHERE lr.is_active = TRUE
ORDER BY clc.category_name, lr.law_name;

CREATE OR REPLACE VIEW active_debt_collectors AS
SELECT 
    legal_name,
    dba,
    parent_company,
    category,
    state,
    phone_primary,
    website,
    notes
FROM credit_industry_entities
WHERE entity_type = 'Debt Collector' AND is_active = TRUE
ORDER BY legal_name;

CREATE OR REPLACE VIEW credit_reporting_agencies AS
SELECT 
    legal_name,
    dba,
    parent_company,
    entity_type,
    category,
    website,
    notes
FROM credit_industry_entities
WHERE entity_type IN ('Credit Reporting Agency', 'Specialty CRA') AND is_active = TRUE
ORDER BY entity_type, legal_name;

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credit_entities_updated_at BEFORE UPDATE ON credit_industry_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert additional state-specific regulations
INSERT INTO state_regulations (state, regulation_type, description, citation, licensing_required, disclosure_required, statute_of_limitations_years) VALUES
('CA', 'Debt Collection', 'California Fair Debt Collection Practices Act', 'Cal. Civ. Code § 1788 et seq.', TRUE, TRUE, 4),
('NY', 'Debt Collection', 'New York Fair Debt Collection Practices Act', 'N.Y. Gen. Bus. Law § 601 et seq.', TRUE, TRUE, 6),
('TX', 'Debt Collection', 'Texas Finance Code Debt Collection Provisions', 'Tex. Fin. Code § 392 et seq.', TRUE, TRUE, 4),
('FL', 'Debt Collection', 'Florida Consumer Collection Practices Act', 'Fla. Stat. § 559.55 et seq.', TRUE, TRUE, 5),
('IL', 'Credit Repair', 'Illinois Credit Services Organizations Act', '815 ILCS 605/', TRUE, TRUE, 3),
('CA', 'Credit Repair', 'California Credit Services Act', 'Cal. Civ. Code § 1789.10 et seq.', TRUE, TRUE, 4),
('NY', 'Credit Repair', 'New York Credit Services Business Law', 'N.Y. Gen. Bus. Law § 458-a et seq.', TRUE, TRUE, 6),
('TX', 'Credit Repair', 'Texas Credit Services Organization Act', 'Tex. Fin. Code § 393 et seq.', TRUE, TRUE, 4);

-- Create comprehensive compliance tracking
CREATE TABLE IF NOT EXISTS law_compliance_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_id UUID REFERENCES laws_regulations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    compliance_item TEXT NOT NULL,
    is_compliant BOOLEAN DEFAULT FALSE,
    compliance_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Final summary comment
-- This integration adds comprehensive credit laws and industry data
-- including federal and state regulations, debt collectors, credit bureaus,
-- specialty CRAs, compliance requirements, and enforcement mechanisms.
-- The database now contains a complete framework for credit repair operations
-- with full legal backing and industry intelligence.

COMMIT;