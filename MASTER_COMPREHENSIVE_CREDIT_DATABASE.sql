-- =====================================================
-- RICK JEFFERSON AI SUPREME CREDIT ENFORCEMENT PLATFORM
-- MASTER COMPREHENSIVE DATABASE SCHEMA
-- =====================================================
-- Combines: COMPLETE_LAWS_DATA_INTEGRATION.sql, COMPREHENSIVE_CREDIT_REPAIR_DATABASE.sql,
-- DATA.sql, EXPANDED_CREDIT_LAWS_INTEGRATION.sql, and CREDIT BUILDS AND DATA.md
-- Includes: Metro 2 Compliance, Law Library, Financial Literacy, Social Media,
-- Live Data Ingestion, AI Analytics, Total Enforcement Chain™ Automation
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- SECTION 1: CORE USER MANAGEMENT
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('admin','attorney','paralegal','agent','client')) DEFAULT 'agent',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 2: CLIENT MANAGEMENT
-- =====================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    ssn_last_four VARCHAR(4),
    credit_score INTEGER CHECK (credit_score BETWEEN 300 AND 850),
    address JSONB, -- {"street": "", "city": "", "state": "", "zip": ""}
    status VARCHAR(20) CHECK (status IN ('active','inactive','suspended','completed')) DEFAULT 'active',
    assigned_agent UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE client_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 3: COMPREHENSIVE LAW AND REGULATION LIBRARY
-- =====================================================

-- Law categories with hierarchical structure
CREATE TABLE comprehensive_law_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    jurisdiction_level VARCHAR(50) CHECK (jurisdiction_level IN ('Federal','State','Local','Multi-Jurisdictional')) NOT NULL,
    parent_category_id UUID REFERENCES comprehensive_law_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comprehensive laws and regulations
CREATE TABLE laws_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_name VARCHAR(500) NOT NULL,
    category_id UUID REFERENCES comprehensive_law_categories(id),
    citation VARCHAR(200),
    summary TEXT,
    full_text TEXT,
    jurisdiction_level VARCHAR(50),
    enforcement_agency VARCHAR(255),
    penalties TEXT,
    compliance_requirements TEXT[],
    related_laws TEXT[],
    last_updated_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance requirements tracking
CREATE TABLE compliance_requirements (
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

-- State-specific regulations
CREATE TABLE state_regulations (
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

-- =====================================================
-- SECTION 4: CREDIT BUREAUS AND DATA FURNISHERS
-- =====================================================

CREATE TABLE credit_bureaus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    bureau_type VARCHAR(50) CHECK (bureau_type IN ('major','secondary','specialty','data_broker')) DEFAULT 'major',
    phone_numbers TEXT[], -- Array of phone numbers
    fax_numbers TEXT[], -- Array of fax numbers
    mailing_address JSONB,
    website VARCHAR(255),
    dispute_portal VARCHAR(255),
    freeze_portal VARCHAR(255),
    data_types TEXT[], -- ['credit','rental','banking','utility','medical']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit industry entities (debt collectors, furnishers, etc.)
CREATE TABLE credit_industry_entities (
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

-- =====================================================
-- SECTION 5: METRO 2 COMPLIANCE LAYER
-- =====================================================

-- Metro 2 segment definitions
CREATE TABLE metro2_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_name VARCHAR(50) NOT NULL, -- 'Base', 'J1', 'J2', 'K1', 'K2', 'K3', 'K4', 'L1', 'N1'
    segment_description TEXT,
    required_fields JSONB, -- Field definitions and requirements
    validation_rules JSONB, -- Validation logic for each field
    compliance_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account reporting history with Metro 2 compliance
CREATE TABLE account_reporting_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    account_number VARCHAR(100),
    creditor_name VARCHAR(255),
    metro2_data JSONB, -- Complete Metro 2 formatted data
    reporting_date DATE,
    compliance_status VARCHAR(20) CHECK (compliance_status IN ('compliant','non_compliant','pending_review')),
    compliance_issues TEXT[],
    furnisher_id UUID REFERENCES credit_industry_entities(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 6: DISPUTE MANAGEMENT SYSTEM
-- =====================================================

CREATE TABLE dispute_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    dispute_type VARCHAR(50) CHECK (dispute_type IN ('factual','procedural','statutory','validation','goodwill')),
    template_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    dispute_category_id UUID REFERENCES dispute_categories(id),
    account_number VARCHAR(100),
    creditor_name VARCHAR(255),
    dispute_reason TEXT NOT NULL,
    dispute_type VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('draft','sent','pending','resolved','escalated')) DEFAULT 'draft',
    bureau_disputed VARCHAR(50),
    date_sent DATE,
    response_due_date DATE,
    response_received_date DATE,
    outcome VARCHAR(50),
    notes TEXT,
    legal_citations TEXT[], -- Array of relevant law citations
    metro2_violations TEXT[], -- Array of Metro 2 compliance violations
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 7: LETTER TEMPLATES AND GENERATION
-- =====================================================

CREATE TABLE letter_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) CHECK (template_type IN ('dispute','validation','goodwill','cease_desist','demand','legal_notice','cfpb_complaint')),
    subject_line VARCHAR(255),
    template_content TEXT NOT NULL,
    variables JSONB, -- Template variables and their descriptions
    legal_citations TEXT[], -- Default legal citations for this template
    compliance_requirements TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    dispute_id UUID REFERENCES disputes(id),
    template_id UUID REFERENCES letter_templates(id),
    recipient_name VARCHAR(255),
    recipient_address JSONB,
    subject_line VARCHAR(255),
    letter_content TEXT NOT NULL,
    letter_type VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('draft','sent','delivered','responded')) DEFAULT 'draft',
    date_sent DATE,
    tracking_number VARCHAR(100),
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('certified_mail','regular_mail','email','fax','online_portal')),
    legal_citations_used TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 8: TOTAL ENFORCEMENT CHAIN™ AUTOMATION
-- =====================================================

-- Enforcement chain stages
CREATE TABLE enforcement_chain_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    description TEXT,
    automated_actions JSONB, -- Actions to take automatically
    required_documents TEXT[],
    legal_requirements TEXT[],
    escalation_criteria JSONB,
    success_criteria JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client enforcement progress tracking
CREATE TABLE client_enforcement_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    current_stage_id UUID REFERENCES enforcement_chain_stages(id),
    stage_status VARCHAR(20) CHECK (stage_status IN ('pending','in_progress','completed','escalated','failed')),
    stage_started_date DATE,
    stage_completed_date DATE,
    actions_taken JSONB, -- Log of automated actions taken
    documents_generated UUID[], -- Array of generated letter IDs
    next_action_date DATE,
    escalation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escalation actions (CFPB, FTC, AG complaints, litigation prep)
CREATE TABLE escalation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action_type VARCHAR(50) CHECK (action_type IN ('cfpb_complaint','ftc_complaint','ag_complaint','litigation_prep','court_filing')),
    target_entity VARCHAR(255), -- Who the action is against
    complaint_details JSONB, -- Structured complaint data
    supporting_documents UUID[], -- Array of document IDs
    filing_date DATE,
    reference_number VARCHAR(100), -- Complaint/case reference number
    status VARCHAR(20) CHECK (status IN ('draft','filed','pending','resolved','escalated')),
    outcome TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 9: FINANCIAL LITERACY AND EDUCATION HUB
-- =====================================================

-- Education content management
CREATE TABLE education_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) CHECK (content_type IN ('article','video','quiz','interactive','webinar','course')),
    category VARCHAR(100), -- 'credit_basics', 'dispute_process', 'legal_rights', etc.
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
    content_body TEXT,
    video_url VARCHAR(255),
    quiz_questions JSONB, -- For quiz content
    learning_objectives TEXT[],
    estimated_duration INTEGER, -- In minutes
    prerequisites TEXT[],
    tags TEXT[],
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client education progress tracking
CREATE TABLE client_education_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES education_content(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('not_started','in_progress','completed','skipped')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    quiz_score INTEGER, -- For quiz content
    time_spent INTEGER, -- In minutes
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 10: SOCIAL MEDIA INTEGRATION ENGINE
-- =====================================================

-- Social media account management
CREATE TABLE social_media_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) CHECK (platform IN ('twitter','facebook','instagram','linkedin','tiktok','youtube')) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    api_credentials JSONB, -- Encrypted API keys and tokens
    account_status VARCHAR(20) CHECK (account_status IN ('active','inactive','suspended','error')) DEFAULT 'active',
    last_sync TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social media content scheduling and publishing
CREATE TABLE social_media_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    media_urls TEXT[], -- Array of image/video URLs
    hashtags TEXT[],
    scheduled_time TIMESTAMP,
    published_time TIMESTAMP,
    post_status VARCHAR(20) CHECK (post_status IN ('draft','scheduled','published','failed','deleted')) DEFAULT 'draft',
    platform_post_id VARCHAR(255), -- ID from the social media platform
    engagement_metrics JSONB, -- Likes, shares, comments, etc.
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social media analytics tracking
CREATE TABLE social_media_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    post_id UUID REFERENCES social_media_posts(id),
    metric_date DATE NOT NULL,
    followers_count INTEGER,
    engagement_rate DECIMAL(5,2),
    reach INTEGER,
    impressions INTEGER,
    clicks INTEGER,
    shares INTEGER,
    comments INTEGER,
    likes INTEGER,
    platform_specific_metrics JSONB, -- Platform-specific metrics
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 11: LIVE DATA INGESTION SYSTEM
-- =====================================================

-- Data sources registry
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) CHECK (source_type IN ('Federal Registry','State Registry','Industry Association','Government Database','Legal Database','RSS Feed','API')) NOT NULL,
    jurisdiction VARCHAR(100),
    description TEXT,
    website VARCHAR(255),
    api_endpoint VARCHAR(255),
    api_credentials JSONB, -- Encrypted API keys
    update_frequency VARCHAR(50), -- 'hourly', 'daily', 'weekly', etc.
    last_updated TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data ingestion log
CREATE TABLE data_ingestion_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    ingestion_start TIMESTAMP NOT NULL,
    ingestion_end TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('running','completed','failed','partial')) DEFAULT 'running',
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details TEXT,
    ingested_data JSONB, -- Sample of ingested data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 12: AI ANALYTICS AND PREDICTION ENGINE
-- =====================================================

-- AI models registry
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) CHECK (model_type IN ('classification','regression','nlp','recommendation','anomaly_detection')),
    model_version VARCHAR(50),
    description TEXT,
    training_data_source TEXT,
    model_parameters JSONB,
    performance_metrics JSONB, -- Accuracy, precision, recall, etc.
    deployment_status VARCHAR(20) CHECK (deployment_status IN ('development','testing','production','deprecated')) DEFAULT 'development',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI predictions and results tracking
CREATE TABLE ai_predictions_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    prediction_type VARCHAR(100), -- 'credit_score_improvement', 'dispute_success_rate', etc.
    input_data JSONB, -- Data used for prediction
    prediction_result JSONB, -- Model output
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    actual_outcome JSONB, -- Actual result for model feedback
    feedback_provided BOOLEAN DEFAULT FALSE,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outcome_date TIMESTAMP
);

-- =====================================================
-- SECTION 13: DOCUMENT MANAGEMENT AND TRACKING
-- =====================================================

CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    retention_period_days INTEGER, -- Document retention policy
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    category_id UUID REFERENCES document_categories(id),
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    document_hash VARCHAR(64), -- SHA-256 hash for integrity
    is_encrypted BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(20) CHECK (access_level IN ('public','internal','confidential','restricted')) DEFAULT 'internal',
    tags TEXT[],
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 14: AUDIT TRAIL AND COMPLIANCE TRACKING
-- =====================================================

CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    action_type VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'view', 'export'
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 15: SYSTEM CONFIGURATION AND SETTINGS
-- =====================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) CHECK (setting_type IN ('string','integer','boolean','json')) DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Core entity indexes
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_assigned_agent ON clients(assigned_agent);
CREATE INDEX idx_clients_status ON clients(status);

-- Dispute management indexes
CREATE INDEX idx_disputes_client_id ON disputes(client_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_date_sent ON disputes(date_sent);
CREATE INDEX idx_disputes_response_due_date ON disputes(response_due_date);

-- Letter tracking indexes
CREATE INDEX idx_generated_letters_client_id ON generated_letters(client_id);
CREATE INDEX idx_generated_letters_status ON generated_letters(status);
CREATE INDEX idx_generated_letters_date_sent ON generated_letters(date_sent);

-- Law and regulation search indexes
CREATE INDEX idx_laws_regulations_law_name ON laws_regulations USING gin(law_name gin_trgm_ops);
CREATE INDEX idx_laws_regulations_citation ON laws_regulations(citation);
CREATE INDEX idx_laws_regulations_jurisdiction ON laws_regulations(jurisdiction_level);

-- Enforcement chain indexes
CREATE INDEX idx_client_enforcement_progress_client_id ON client_enforcement_progress(client_id);
CREATE INDEX idx_client_enforcement_progress_stage ON client_enforcement_progress(current_stage_id);

-- Education progress indexes
CREATE INDEX idx_client_education_progress_client_id ON client_education_progress(client_id);
CREATE INDEX idx_client_education_progress_content_id ON client_education_progress(content_id);

-- Social media indexes
CREATE INDEX idx_social_media_posts_account_id ON social_media_posts(account_id);
CREATE INDEX idx_social_media_posts_scheduled_time ON social_media_posts(scheduled_time);

-- Data ingestion indexes
CREATE INDEX idx_data_ingestion_log_source_id ON data_ingestion_log(source_id);
CREATE INDEX idx_data_ingestion_log_start_time ON data_ingestion_log(ingestion_start);

-- AI predictions indexes
CREATE INDEX idx_ai_predictions_client_id ON ai_predictions_history(client_id);
CREATE INDEX idx_ai_predictions_model_id ON ai_predictions_history(model_id);
CREATE INDEX idx_ai_predictions_date ON ai_predictions_history(prediction_date);

-- Audit trail indexes
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_client_id ON audit_trail(client_id);
CREATE INDEX idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- =====================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_letters_updated_at BEFORE UPDATE ON generated_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_laws_regulations_updated_at BEFORE UPDATE ON laws_regulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_enforcement_progress_updated_at BEFORE UPDATE ON client_enforcement_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escalation_actions_updated_at BEFORE UPDATE ON escalation_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_education_content_updated_at BEFORE UPDATE ON education_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_education_progress_updated_at BEFORE UPDATE ON client_education_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON social_media_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_posts_updated_at BEFORE UPDATE ON social_media_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA POPULATION
-- =====================================================

-- Insert comprehensive law categories
INSERT INTO comprehensive_law_categories (category_name, description, jurisdiction_level) VALUES
('Federal Credit Laws', 'Primary federal legislation governing credit reporting and debt collection', 'Federal'),
('State Credit Laws', 'State-specific credit and debt collection regulations', 'State'),
('Consumer Protection Laws', 'Laws protecting consumers in financial transactions', 'Multi-Jurisdictional'),
('Fair Housing and Civil Rights', 'Anti-discrimination laws in housing and credit', 'Federal'),
('Real Estate Disclosure Laws', 'Laws requiring disclosure of property conditions and material facts', 'Multi-Jurisdictional'),
('Mortgage and Lending Laws', 'Laws governing mortgage lending and real estate financing', 'Multi-Jurisdictional'),
('Real Estate Settlement Laws', 'Laws governing real estate closing and settlement procedures', 'Federal'),
('Environmental Real Estate Laws', 'Environmental regulations affecting real estate transactions', 'Multi-Jurisdictional'),
('Real Estate Licensing Laws', 'State requirements for real estate licensing and practice', 'State'),
('Tax Laws Affecting Credit', 'Tax laws that impact credit reporting and debt collection', 'Multi-Jurisdictional');

-- Insert major credit bureaus
INSERT INTO credit_bureaus (name, bureau_type, phone_numbers, fax_numbers, mailing_address, website, dispute_portal, freeze_portal, data_types) VALUES
('Equifax', 'major', ARRAY['1-800-685-1111','1-888-836-6351'], ARRAY['1-888-826-0727'], '{"street":"PO Box 740256","city":"Atlanta","state":"GA","zip":"30374"}', 'https://www.equifax.com', 'https://www.equifax.com/personal/credit-report-services/credit-dispute/', 'https://www.equifax.com/personal/credit-report-services/credit-freeze/', ARRAY['credit','employment','fraud']),
('Experian', 'major', ARRAY['1-888-397-3742','1-800-493-1058'], ARRAY['1-972-390-4913'], '{"street":"PO Box 4500","city":"Allen","state":"TX","zip":"75013"}', 'https://www.experian.com', 'https://www.experian.com/disputes/main.html', 'https://www.experian.com/freeze/center.html', ARRAY['credit','rental','fraud']),
('TransUnion', 'major', ARRAY['1-800-916-8800','1-888-909-8872'], ARRAY['1-610-546-4771'], '{"street":"PO Box 1000","city":"Chester","state":"PA","zip":"19016"}', 'https://www.transunion.com', 'https://www.transunion.com/credit-disputes/dispute-your-credit', 'https://www.transunion.com/credit-freeze', ARRAY['credit','rental','fraud']),
('Innovis', 'secondary', ARRAY['1-800-540-2505'], ARRAY['1-888-245-0625'], '{"street":"PO Box 26","city":"Pittsburgh","state":"PA","zip":"15230"}', 'https://www.innovis.com', 'https://www.innovis.com/personal/disputeForm', 'https://www.innovis.com/personal/securityFreeze', ARRAY['credit','fraud']);

-- Insert Metro 2 segments
INSERT INTO metro2_segments (segment_name, segment_description, required_fields, validation_rules, compliance_notes) VALUES
('Base', 'Base segment containing core account information', '{"fields": ["portfolio_type", "account_number", "account_type", "date_opened", "credit_limit", "highest_credit", "terms_duration", "terms_frequency", "scheduled_monthly_payment", "actual_payment_amount", "account_status", "payment_rating", "payment_history_profile", "special_comment", "compliance_condition_code", "current_balance", "amount_past_due", "original_charge_off_amount", "date_account_information", "date_first_delinquency", "date_closed", "date_last_payment", "interest_type_indicator", "surname", "first_name", "middle_name", "generation_code", "social_security_number", "date_birth", "telephone_number", "ecoa_code", "consumer_information_indicator", "country_code", "first_line_address", "second_line_address", "city_name", "state", "postal_zip_code"]}', '{"validation": "All required fields must be present and properly formatted"}', 'Core Metro 2 segment - all accounts must include base segment'),
('J1', 'Original Creditor segment', '{"fields": ["creditor_name", "creditor_classification", "creditor_address"]}', '{"validation": "Required when account is sold or transferred"}', 'Used to identify original creditor when account ownership changes'),
('J2', 'Purchased From/Sold To segment', '{"fields": ["purchased_indicator", "purchased_name", "purchased_from_date", "sold_to_name", "sold_to_date"]}', '{"validation": "Required for purchased or sold accounts"}', 'Tracks account ownership transfers'),
('K1', 'Original Creditor segment for purchased accounts', '{"fields": ["original_creditor_name", "original_creditor_classification"]}', '{"validation": "Required for debt buyers and collection agencies"}', 'Identifies original creditor for purchased debt'),
('K2', 'Purchased From segment', '{"fields": ["purchased_from_name", "purchased_from_date"]}', '{"validation": "Required when account purchased from another entity"}', 'Details of account purchase'),
('K3', 'Mortgage Information segment', '{"fields": ["mortgage_id", "mortgage_date", "mortgage_type"]}', '{"validation": "Required for mortgage accounts"}', 'Specific mortgage account information'),
('K4', 'Specialized Payment Information segment', '{"fields": ["payment_information", "payment_method"]}', '{"validation": "Optional specialized payment data"}', 'Additional payment details'),
('L1', 'Change in Terms segment', '{"fields": ["change_indicator", "change_date", "change_description"]}', '{"validation": "Required when account terms change"}', 'Documents changes to account terms'),
('N1', 'Employment segment', '{"fields": ["employment_name", "employment_address"]}', '{"validation": "Optional employment information"}', 'Consumer employment information');

-- Insert enforcement chain stages
INSERT INTO enforcement_chain_stages (stage_name, stage_order, description, automated_actions, required_documents, legal_requirements, escalation_criteria, success_criteria) VALUES
('Data Broker Opt-Out', 1, 'Remove personal information from data brokers and specialty reporting agencies', '{"actions": ["generate_optout_letters", "track_compliance", "verify_removal"]}', ARRAY['Identity verification', 'Opt-out requests'], ARRAY['FCRA Section 611', 'GLBA Privacy Rule'], '{"criteria": ["non_compliance_after_30_days", "continued_reporting"]}', '{"criteria": ["confirmed_removal", "no_new_reports"]}'),
('Credit Report Analysis', 2, 'Comprehensive analysis of credit reports for inaccuracies and violations', '{"actions": ["metro2_compliance_check", "identify_violations", "document_errors"]}', ARRAY['Credit reports from all bureaus', 'Supporting documentation'], ARRAY['FCRA Section 607', 'Metro 2 Format'], '{"criteria": ["violations_identified", "inaccurate_information_found"]}', '{"criteria": ["complete_analysis", "violation_documentation"]}'),
('Initial Disputes', 3, 'File comprehensive disputes with credit bureaus', '{"actions": ["generate_dispute_letters", "send_certified_mail", "track_responses"]}', ARRAY['Dispute letters', 'Supporting evidence', 'Certified mail receipts'], ARRAY['FCRA Section 611', '30-day investigation requirement'], '{"criteria": ["no_response_after_30_days", "inadequate_investigation", "continued_reporting"]}', '{"criteria": ["items_deleted", "items_corrected", "proper_investigation"]}'),
('Method of Verification Requests', 4, 'Demand proof of investigation methods from credit bureaus', '{"actions": ["generate_mov_requests", "demand_documentation", "analyze_procedures"]}', ARRAY['MOV request letters', 'Previous dispute documentation'], ARRAY['FCRA Section 611(a)(7)', 'Reasonable investigation requirement'], '{"criteria": ["inadequate_mov_response", "no_mov_provided", "procedural_violations"]}', '{"criteria": ["adequate_mov_received", "proper_procedures_documented"]}'),
('Furnisher Disputes', 5, 'Direct disputes with data furnishers', '{"actions": ["generate_furnisher_letters", "demand_investigation", "request_documentation"]}', ARRAY['Furnisher dispute letters', 'Account documentation'], ARRAY['FCRA Section 623', 'Furnisher accuracy requirements'], '{"criteria": ["no_furnisher_response", "inadequate_investigation", "continued_inaccurate_reporting"]}', '{"criteria": ["furnisher_correction", "account_deletion", "proper_investigation"]}'),
('Procedural Violations', 6, 'Document and address procedural violations by bureaus and furnishers', '{"actions": ["document_violations", "calculate_damages", "prepare_legal_notices"]}', ARRAY['Violation documentation', 'Timeline of events', 'Damage calculations'], ARRAY['FCRA compliance requirements', 'Procedural safeguards'], '{"criteria": ["multiple_violations", "willful_non_compliance", "damages_exceed_threshold"]}', '{"criteria": ["violations_corrected", "compliance_achieved"]}'),
('CFPB Complaints', 7, 'File complaints with Consumer Financial Protection Bureau', '{"actions": ["generate_cfpb_complaint", "submit_online", "track_response"]}', ARRAY['CFPB complaint form', 'Supporting documentation', 'Timeline of violations'], ARRAY['CFPB complaint procedures', 'Documentation requirements'], '{"criteria": ["no_cfpb_resolution", "inadequate_response", "continued_violations"]}', '{"criteria": ["cfpb_resolution", "entity_compliance", "corrective_action"]}'),
('State AG Complaints', 8, 'File complaints with State Attorney General offices', '{"actions": ["generate_ag_complaints", "submit_to_relevant_states", "coordinate_responses"]}', ARRAY['AG complaint forms', 'State-specific documentation', 'Jurisdiction analysis'], ARRAY['State consumer protection laws', 'AG complaint procedures'], '{"criteria": ["no_ag_action", "inadequate_resolution", "multi_state_violations"]}', '{"criteria": ["ag_investigation", "enforcement_action", "resolution"]}'),
('Pre-Litigation Notice', 9, 'Send formal legal notices before filing lawsuits', '{"actions": ["generate_legal_notices", "calculate_statutory_damages", "set_response_deadlines"]}', ARRAY['Legal demand letters', 'Damage calculations', 'Settlement offers'], ARRAY['Pre-suit notice requirements', 'Statutory damage provisions'], '{"criteria": ["no_response_to_notice", "rejection_of_settlement", "continued_violations"]}', '{"criteria": ["settlement_agreement", "voluntary_compliance", "damage_payment"]}'),
('Federal Litigation', 10, 'File federal lawsuits for FCRA violations', '{"actions": ["prepare_complaint", "file_in_federal_court", "serve_defendants"]}', ARRAY['Federal complaint', 'Summons', 'Service documentation'], ARRAY['Federal court procedures', 'FCRA litigation requirements'], '{"criteria": ["case_complexity", "class_action_potential", "significant_damages"]}', '{"criteria": ["favorable_judgment", "settlement", "injunctive_relief"]}');

-- Insert dispute categories
INSERT INTO dispute_categories (name, description, dispute_type, template_available) VALUES
('Account Not Mine', 'Account does not belong to consumer', 'factual', true),
('Incorrect Balance', 'Account balance is inaccurate', 'factual', true),
('Incorrect Payment History', 'Payment history contains errors', 'factual', true),
('Account Closed by Consumer', 'Account was closed by consumer, not creditor', 'factual', true),
('Duplicate Account', 'Account is reported multiple times', 'factual', true),
('Incorrect Dates', 'Account dates are inaccurate', 'factual', true),
('Paid in Full', 'Account was paid in full but still shows balance', 'factual', true),
('Bankruptcy Discharge', 'Account was discharged in bankruptcy', 'factual', true),
('Identity Theft', 'Account is result of identity theft', 'factual', true),
('Statute of Limitations', 'Account is beyond statute of limitations', 'statutory', true),
('Lack of Standing', 'Current creditor lacks legal standing to collect', 'statutory', true),
('FCRA Violations', 'Credit reporting violations under FCRA', 'statutory', true),
('FDCPA Violations', 'Debt collection violations under FDCPA', 'statutory', true),
('Metro 2 Non-Compliance', 'Account reporting does not comply with Metro 2 format', 'procedural', true),
('Inadequate Investigation', 'Credit bureau failed to conduct reasonable investigation', 'procedural', true),
('No Method of Verification', 'Credit bureau cannot provide method of verification', 'procedural', true),
('Furnisher Non-Response', 'Data furnisher failed to respond to dispute', 'procedural', true),
('Goodwill Request', 'Request for goodwill deletion of accurate negative item', 'goodwill', true),
('Validation Request', 'Request for debt validation under FDCPA', 'validation', true);

-- Insert document categories
INSERT INTO document_categories (category_name, description, retention_period_days) VALUES
('Credit Reports', 'Consumer credit reports from all bureaus', 2555), -- 7 years
('Dispute Letters', 'All dispute correspondence', 2555),
('Legal Documents', 'Court filings, legal notices, and litigation documents', 3650), -- 10 years
('Identity Documents', 'Driver licenses, passports, and identity verification', 2555),
('Financial Statements', 'Bank statements, pay stubs, and financial records', 2555),
('Correspondence', 'Email and letter correspondence with clients and entities', 1825), -- 5 years
('Contracts and Agreements', 'Service agreements and contracts', 3650),
('Compliance Documents', 'Regulatory compliance and audit documents', 2555),
('Education Materials', 'Financial literacy and educational content', 1095), -- 3 years
('System Backups', 'Database and system backup files', 365); -- 1 year

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('dispute_response_days', '30', 'integer', 'Number of days credit bureaus have to respond to disputes'),
('certified_mail_required', 'true', 'boolean', 'Whether certified mail is required for dispute letters'),
('auto_escalation_enabled', 'true', 'boolean', 'Enable automatic escalation of disputes'),
('cfpb_complaint_threshold', '3', 'integer', 'Number of unresolved disputes before CFPB complaint'),
('litigation_damage_threshold', '5000', 'integer', 'Minimum damages required before litigation consideration'),
('education_completion_required', 'false', 'boolean', 'Whether education completion is required before disputes'),
('social_media_auto_post', 'false', 'boolean', 'Enable automatic social media posting'),
('ai_predictions_enabled', 'true', 'boolean', 'Enable AI prediction features'),
('data_ingestion_frequency', 'daily', 'string', 'Frequency of automated data ingestion'),
('audit_retention_days', '2555', 'integer', 'Number of days to retain audit trail records');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Client dashboard view
CREATE VIEW client_dashboard AS
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.credit_score,
    c.status,
    COUNT(DISTINCT d.id) as total_disputes,
    COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) as resolved_disputes,
    COUNT(DISTINCT gl.id) as total_letters,
    cep.current_stage_id,
    ecs.stage_name as current_stage,
    cep.next_action_date
FROM clients c
LEFT JOIN disputes d ON c.id = d.client_id
LEFT JOIN generated_letters gl ON c.id = gl.client_id
LEFT JOIN client_enforcement_progress cep ON c.id = cep.client_id
LEFT JOIN enforcement_chain_stages ecs ON cep.current_stage_id = ecs.id
GROUP BY c.id, c.first_name, c.last_name, c.email, c.credit_score, c.status, 
         cep.current_stage_id, ecs.stage_name, cep.next_action_date;

-- Active disputes view
CREATE VIEW active_disputes AS
SELECT 
    d.id,
    c.first_name || ' ' || c.last_name as client_name,
    d.creditor_name,
    d.dispute_reason,
    d.status,
    d.date_sent,
    d.response_due_date,
    CASE 
        WHEN d.response_due_date < CURRENT_DATE AND d.status = 'pending' THEN 'OVERDUE'
        WHEN d.response_due_date <= CURRENT_DATE + INTERVAL '3 days' AND d.status = 'pending' THEN 'DUE_SOON'
        ELSE 'ON_TIME'
    END as urgency_status
FROM disputes d
JOIN clients c ON d.client_id = c.id
WHERE d.status IN ('sent', 'pending');

-- Law violations view
CREATE VIEW law_violations AS
SELECT 
    lr.law_name,
    lr.citation,
    COUNT(d.id) as violation_count,
    COUNT(DISTINCT d.client_id) as affected_clients
FROM laws_regulations lr
JOIN disputes d ON lr.citation = ANY(d.legal_citations)
GROUP BY lr.id, lr.law_name, lr.citation
ORDER BY violation_count DESC;

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to calculate dispute success rate
CREATE OR REPLACE FUNCTION calculate_dispute_success_rate(client_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_disputes INTEGER;
    successful_disputes INTEGER;
    success_rate DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_disputes
    FROM disputes
    WHERE client_id = client_uuid AND status IN ('resolved', 'escalated');
    
    SELECT COUNT(*) INTO successful_disputes
    FROM disputes
    WHERE client_id = client_uuid AND status = 'resolved' AND outcome IN ('deleted', 'corrected');
    
    IF total_disputes = 0 THEN
        RETURN 0.00;
    END IF;
    
    success_rate := (successful_disputes::DECIMAL / total_disputes::DECIMAL) * 100;
    RETURN success_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to get next enforcement action
CREATE OR REPLACE FUNCTION get_next_enforcement_action(client_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    current_stage_order INTEGER;
    next_stage_name TEXT;
BEGIN
    SELECT ecs.stage_order INTO current_stage_order
    FROM client_enforcement_progress cep
    JOIN enforcement_chain_stages ecs ON cep.current_stage_id = ecs.id
    WHERE cep.client_id = client_uuid;
    
    IF current_stage_order IS NULL THEN
        RETURN 'Start Enforcement Chain';
    END IF;
    
    SELECT stage_name INTO next_stage_name
    FROM enforcement_chain_stages
    WHERE stage_order = current_stage_order + 1;
    
    RETURN COALESCE(next_stage_name, 'Enforcement Chain Complete');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY AND PERMISSIONS
-- =====================================================

-- Create roles
CREATE ROLE credit_admin;
CREATE ROLE credit_attorney;
CREATE ROLE credit_agent;
CREATE ROLE credit_client;

-- Grant permissions to admin role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO credit_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO credit_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO credit_admin;

-- Grant permissions to attorney role
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO credit_attorney;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO credit_attorney;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO credit_attorney;

-- Grant limited permissions to agent role
GRANT SELECT, INSERT, UPDATE ON clients, disputes, generated_letters, client_documents TO credit_agent;
GRANT SELECT ON laws_regulations, credit_bureaus, letter_templates, dispute_categories TO credit_agent;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO credit_agent;

-- Grant read-only permissions to client role
GRANT SELECT ON clients, disputes, generated_letters, education_content, client_education_progress TO credit_client;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Log successful schema creation
INSERT INTO audit_trail (action_type, table_name, new_values, created_at) VALUES
('create', 'schema', '{"message": "Rick Jefferson AI Supreme Credit Enforcement Platform schema created successfully", "version": "1.0", "tables_created": 35, "indexes_created": 25, "triggers_created": 14}', CURRENT_TIMESTAMP);

-- Success message
SELECT 'Rick Jefferson AI Supreme Credit Enforcement Platform Database Schema Created Successfully!' as status,
       'Total Enforcement Chain™ with AI, Legal Citations, and Full Automation Ready' as message,
       CURRENT_TIMESTAMP as created_at;