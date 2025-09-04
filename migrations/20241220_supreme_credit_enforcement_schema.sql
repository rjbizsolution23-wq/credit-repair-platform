-- Supreme Credit Enforcement Chain™ - Complete Database Schema
-- Rick Jefferson AI Master System Integration
-- Combines Metro 2 compliance, law libraries, enforcement automation, social media, and AI predictions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========== METRO 2 COMPLIANCE TABLES ==========

-- Metro 2 Account Segments (Credit Reporting Format)
CREATE TABLE metro2_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    furnisher_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    account_type VARCHAR(10), -- CC, IL, MT, etc.
    date_opened DATE,
    date_closed DATE,
    credit_limit DECIMAL(12,2),
    high_balance DECIMAL(12,2),
    current_balance DECIMAL(12,2),
    payment_amount DECIMAL(12,2),
    payment_history JSONB, -- 24-month payment pattern
    account_status VARCHAR(10), -- 11, 61, 71, 78, 80, 82, 83, 84, 93, 94, 95, 96, 97
    compliance_flags JSONB, -- Metro 2 format violations
    raw_metro2_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account Reporting History (Track Changes)
CREATE TABLE account_reporting_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metro2_segment_id UUID REFERENCES metro2_segments(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    balance_reported DECIMAL(12,2),
    status_reported VARCHAR(10),
    payment_status VARCHAR(5),
    compliance_score INTEGER, -- 0-100 Metro 2 compliance rating
    violations_found JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== LAWS & REGULATIONS LIBRARY ==========

-- Federal and State Laws Database
CREATE TABLE laws_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_code VARCHAR(50) NOT NULL, -- FCRA, FDCPA, ECOA, etc.
    section VARCHAR(100), -- 15 U.S.C. § 1681i(a)(1)(A)
    title VARCHAR(500) NOT NULL,
    full_text TEXT,
    summary TEXT,
    jurisdiction VARCHAR(50), -- federal, state, local
    state_code VARCHAR(2), -- for state laws
    effective_date DATE,
    last_updated DATE,
    source_url TEXT,
    tags JSONB, -- credit, debt, privacy, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Law References for Letters/Disputes
CREATE TABLE law_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_id UUID REFERENCES laws_regulations(id) ON DELETE CASCADE,
    reference_type VARCHAR(50), -- dispute_letter, validation_request, lawsuit
    citation_text TEXT NOT NULL,
    usage_context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== EDUCATION & FINANCIAL LITERACY ==========

-- Educational Content Library
CREATE TABLE education_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50), -- article, video, infographic, course
    category VARCHAR(100), -- credit_basics, dispute_process, legal_rights
    content TEXT,
    difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
    estimated_read_time INTEGER, -- minutes
    tags JSONB,
    is_public BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Education Progress Tracking
CREATE TABLE client_education_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    content_id UUID REFERENCES education_content(id) ON DELETE CASCADE,
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    quiz_score INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== SOCIAL MEDIA AUTOMATION ==========

-- Social Media Account Management
CREATE TABLE social_media_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL, -- facebook, instagram, twitter, linkedin, tiktok, youtube
    account_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    account_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_post_at TIMESTAMP,
    follower_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social Media Posts & Content Calendar
CREATE TABLE social_media_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    post_type VARCHAR(50), -- text, image, video, carousel, story
    content TEXT NOT NULL,
    media_urls JSONB, -- array of image/video URLs
    hashtags JSONB, -- array of hashtags
    scheduled_for TIMESTAMP,
    posted_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, posted, failed
    post_url TEXT,
    engagement_metrics JSONB, -- likes, shares, comments, views
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social Media Analytics
CREATE TABLE social_media_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    post_id UUID REFERENCES social_media_posts(id) ON DELETE SET NULL,
    metric_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Calendar Templates
CREATE TABLE content_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme VARCHAR(255), -- Financial Literacy Monday, Legal Tip Tuesday
    post_content TEXT,
    media_url TEXT,
    platform_targets JSONB, -- array of platforms
    post_date DATE,
    time_slot TIME,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== LIVE DATA INGESTION ==========

-- Data Sources Configuration
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50), -- rss, api, webhook
    source_url TEXT,
    api_key_encrypted TEXT,
    refresh_interval INTEGER DEFAULT 3600, -- seconds
    last_ingested_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Ingestion Logs
CREATE TABLE data_ingestion_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    ingest_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20), -- success, failed, partial
    records_processed INTEGER DEFAULT 0,
    data_preview TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== AI & ANALYTICS ==========

-- AI Models Configuration
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100), -- dispute_success, letter_generation, compliance_check
    model_version VARCHAR(50),
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    parameters JSONB,
    accuracy_score DECIMAL(5,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Predictions History
CREATE TABLE ai_predictions_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    prediction_type VARCHAR(100),
    input_data JSONB,
    prediction_result JSONB,
    confidence_score DECIMAL(5,4),
    actual_outcome VARCHAR(100),
    prediction_accuracy DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== TOTAL ENFORCEMENT CHAIN™ ==========

-- Enforcement Chain Stages
CREATE TABLE enforcement_chain_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_name VARCHAR(255) NOT NULL,
    stage_order INTEGER NOT NULL,
    description TEXT,
    estimated_duration_days INTEGER,
    required_documents JSONB,
    automation_script TEXT,
    success_criteria JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Enforcement Progress
CREATE TABLE client_enforcement_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    current_stage_id UUID REFERENCES enforcement_chain_stages(id),
    stage_status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, failed, skipped
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    automation_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escalation Actions
CREATE TABLE escalation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES enforcement_chain_stages(id),
    action_type VARCHAR(100), -- letter, complaint, lawsuit, settlement
    action_description TEXT,
    target_entity VARCHAR(255), -- bureau, furnisher, collector
    scheduled_for TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== COMPLIANCE & AUDIT ==========

-- Compliance Audit Log
CREATE TABLE compliance_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    action_type VARCHAR(100),
    entity_type VARCHAR(50), -- client, dispute, letter, payment
    entity_id UUID,
    action_description TEXT,
    compliance_status VARCHAR(50), -- compliant, violation, warning
    risk_level VARCHAR(20), -- low, medium, high, critical
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== FINANCIAL PLANNING ==========

-- Financial Plans & Client Budgeting
CREATE TABLE financial_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    plan_type VARCHAR(100), -- debt_payoff, credit_building, budget
    monthly_income DECIMAL(12,2),
    monthly_expenses DECIMAL(12,2),
    debt_total DECIMAL(12,2),
    savings_goal DECIMAL(12,2),
    target_credit_score INTEGER,
    plan_details JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== EXTERNAL API INTEGRATIONS ==========

-- API Integrations Configuration
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100), -- credit_monitoring, payment, email, sms
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    webhook_url TEXT,
    rate_limit_per_hour INTEGER,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== SECONDARY BUREAUS & DATA BROKERS ==========

-- Secondary Credit Bureaus and Data Brokers
CREATE TABLE secondary_bureaus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bureau_name VARCHAR(255) NOT NULL,
    bureau_type VARCHAR(100), -- credit, rental, banking, utility, medical
    website_url TEXT,
    opt_out_url TEXT,
    freeze_url TEXT,
    dispute_address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    specializes_in JSONB, -- evictions, medical, banking, etc.
    opt_out_method VARCHAR(50), -- online, mail, phone
    freeze_method VARCHAR(50),
    dispute_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Bureau Opt-outs and Freezes
CREATE TABLE client_bureau_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    bureau_id UUID REFERENCES secondary_bureaus(id) ON DELETE CASCADE,
    action_type VARCHAR(50), -- opt_out, freeze, dispute
    action_date DATE,
    status VARCHAR(50), -- pending, completed, failed
    confirmation_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== LETTER GENERATION ENGINE ==========

-- Letter Templates with AI Enhancement
CREATE TABLE letter_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100), -- dispute, validation, opt_out, lawsuit
    target_entity VARCHAR(100), -- bureau, furnisher, collector, court
    template_content TEXT NOT NULL,
    legal_citations JSONB,
    required_variables JSONB,
    ai_enhancement_prompt TEXT,
    success_rate DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated Letters Log
CREATE TABLE generated_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    template_id UUID REFERENCES letter_templates(id),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    letter_type VARCHAR(100),
    recipient_name VARCHAR(255),
    recipient_address TEXT,
    subject_line VARCHAR(500),
    letter_content TEXT,
    variables_used JSONB,
    ai_enhanced BOOLEAN DEFAULT false,
    generation_method VARCHAR(50), -- template, ai, hybrid
    sent_date DATE,
    delivery_method VARCHAR(50), -- certified_mail, email, fax
    tracking_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== PERFORMANCE INDEXES ==========

-- Indexes for better query performance
CREATE INDEX idx_metro2_client_id ON metro2_segments(client_id);
CREATE INDEX idx_metro2_furnisher ON metro2_segments(furnisher_name);
CREATE INDEX idx_laws_code ON laws_regulations(law_code);
CREATE INDEX idx_laws_jurisdiction ON laws_regulations(jurisdiction);
CREATE INDEX idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX idx_social_posts_scheduled ON social_media_posts(scheduled_for);
CREATE INDEX idx_enforcement_client ON client_enforcement_progress(client_id);
CREATE INDEX idx_enforcement_stage ON client_enforcement_progress(current_stage_id);
CREATE INDEX idx_audit_log_client ON compliance_audit_log(client_id);
CREATE INDEX idx_audit_log_action ON compliance_audit_log(action_type);
CREATE INDEX idx_bureau_actions_client ON client_bureau_actions(client_id);
CREATE INDEX idx_letters_client ON generated_letters(client_id);
CREATE INDEX idx_letters_type ON generated_letters(letter_type);

-- Full-text search indexes
CREATE INDEX idx_laws_fulltext ON laws_regulations USING gin(to_tsvector('english', title || ' ' || summary));
CREATE INDEX idx_education_fulltext ON education_content USING gin(to_tsvector('english', title || ' ' || content));

-- ========== TRIGGERS FOR UPDATED_AT ==========

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_metro2_segments_updated_at BEFORE UPDATE ON metro2_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_laws_regulations_updated_at BEFORE UPDATE ON laws_regulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_education_content_updated_at BEFORE UPDATE ON education_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_education_progress_updated_at BEFORE UPDATE ON client_education_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON social_media_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_posts_updated_at BEFORE UPDATE ON social_media_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_enforcement_progress_updated_at BEFORE UPDATE ON client_enforcement_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_plans_updated_at BEFORE UPDATE ON financial_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON api_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_secondary_bureaus_updated_at BEFORE UPDATE ON secondary_bureaus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_bureau_actions_updated_at BEFORE UPDATE ON client_bureau_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_letter_templates_updated_at BEFORE UPDATE ON letter_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_letters_updated_at BEFORE UPDATE ON generated_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== DEFAULT DATA INSERTION ==========

-- Insert default enforcement chain stages
INSERT INTO enforcement_chain_stages (stage_name, stage_order, description, estimated_duration_days) VALUES
('Data Broker Opt-Outs', 1, 'Opt out from LexisNexis, CoreLogic, Innovis, ChexSystems, and other data brokers', 7),
('Credit Bureau Freezes', 2, 'Freeze credit files with all major and secondary bureaus', 3),
('Initial Credit Report Analysis', 3, 'Comprehensive analysis of all credit reports for errors and violations', 5),
('Metro 2 Compliance Audit', 4, 'Technical audit of credit reporting format compliance', 7),
('Initial Dispute Letters', 5, 'Send factual and procedural disputes to bureaus and furnishers', 30),
('Method of Verification Requests', 6, 'Demand detailed verification procedures from bureaus', 30),
('Debt Validation Demands', 7, 'Require proof of debt ownership and original contracts', 30),
('Regulatory Complaints', 8, 'File complaints with CFPB, FTC, and State AG offices', 60),
('Legal Notice of Intent', 9, 'Send formal notice of intent to litigate for violations', 15),
('Small Claims Litigation', 10, 'File lawsuits for statutory damages and deletion', 90);

-- Insert core federal laws
INSERT INTO laws_regulations (law_code, section, title, jurisdiction, effective_date) VALUES
('FCRA', '15 U.S.C. § 1681', 'Fair Credit Reporting Act', 'federal', '1970-10-26'),
('FDCPA', '15 U.S.C. § 1692', 'Fair Debt Collection Practices Act', 'federal', '1977-09-20'),
('ECOA', '15 U.S.C. § 1691', 'Equal Credit Opportunity Act', 'federal', '1974-10-28'),
('GLBA', '15 U.S.C. § 6801', 'Gramm-Leach-Bliley Act', 'federal', '1999-11-12'),
('TILA', '15 U.S.C. § 1601', 'Truth in Lending Act', 'federal', '1968-05-29'),
('CROA', '15 U.S.C. § 1679', 'Credit Repair Organizations Act', 'federal', '1996-09-30');

-- Insert secondary bureaus and data brokers
INSERT INTO secondary_bureaus (bureau_name, bureau_type, website_url, opt_out_url, specializes_in, opt_out_method) VALUES
('LexisNexis Risk Solutions', 'data_broker', 'https://risk.lexisnexis.com', 'https://optout.lexisnexis.com', '["public_records", "evictions", "bankruptcies"]', 'online'),
('CoreLogic Credco', 'rental_screening', 'https://www.corelogic.com', 'https://www.corelogic.com/opt-out', '["evictions", "rental_history", "property_records"]', 'online'),
('ChexSystems', 'banking', 'https://www.chexsystems.com', 'https://www.chexsystems.com/opt-out', '["banking", "checking_accounts", "overdrafts"]', 'online'),
('Innovis', 'credit', 'https://www.innovis.com', 'https://www.innovis.com/personal/securityFreeze', '["credit_reports", "fraud_alerts"]', 'online'),
('NCTUE', 'utility', 'https://www.nctue.com', 'https://www.nctue.com/consumers', '["utility_bills", "telecom", "cable"]', 'mail'),
('Clarity Services', 'subprime', 'https://www.clarityservices.com', 'https://www.clarityservices.com/consumer-request', '["payday_loans", "subprime_lending"]', 'online'),
('Early Warning Services', 'banking', 'https://www.earlywarning.com', 'https://www.earlywarning.com/consumer-information', '["fraud_prevention", "bank_accounts"]', 'online'),
('TeleCheck', 'check_verification', 'https://www.telecheck.com', 'https://www.telecheck.com/consumers/opt-out', '["check_writing", "returned_checks"]', 'online'),
('The Work Number', 'employment', 'https://theworknumber.com', 'https://employees.theworknumber.com/employee-data-freeze', '["employment", "income_verification"]', 'online'),
('MIB Group', 'insurance', 'https://www.mib.com', 'https://www.mib.com/consumer_disclosure.html', '["life_insurance", "health_insurance"]', 'mail');

-- Insert sample letter templates
INSERT INTO letter_templates (template_name, template_type, target_entity, template_content, legal_citations) VALUES
('FCRA Initial Dispute Letter', 'dispute', 'bureau', 'Dear Credit Reporting Agency,\n\nPursuant to my rights under the Fair Credit Reporting Act (15 U.S.C. § 1681i), I am formally disputing the following items on my credit report...', '["15 U.S.C. § 1681i(a)(1)(A)", "15 U.S.C. § 1681i(a)(6)(B)(iii)"]'),
('FDCPA Debt Validation Letter', 'validation', 'collector', 'Dear Debt Collector,\n\nThis letter is sent in response to a notice I received from you. Pursuant to the Fair Debt Collection Practices Act (15 U.S.C. § 1692g), I am requesting validation of this alleged debt...', '["15 U.S.C. § 1692g(b)", "15 U.S.C. § 1692e"]'),
('Data Broker Opt-Out Letter', 'opt_out', 'data_broker', 'Dear Data Broker,\n\nI am writing to exercise my right to opt out of your data collection and sharing practices. Please remove all of my personal information from your databases...', '["15 U.S.C. § 6802", "15 U.S.C. § 6803"]'),
('Method of Verification Request', 'mov_request', 'bureau', 'Dear Credit Bureau,\n\nPursuant to 15 U.S.C. § 1681i(a)(7), I am requesting a description of the procedure used to determine the accuracy and completeness of the information...', '["15 U.S.C. § 1681i(a)(7)"]');

-- Insert sample education content
INSERT INTO education_content (title, content_type, category, content, difficulty_level, estimated_read_time) VALUES
('Understanding Your FCRA Rights', 'article', 'legal_rights', 'The Fair Credit Reporting Act gives you powerful rights to dispute inaccurate information...', 'beginner', 5),
('Metro 2 Format Explained', 'article', 'technical', 'Metro 2 is the standard format used by furnishers to report account information to credit bureaus...', 'advanced', 10),
('How to Read Your Credit Report', 'article', 'credit_basics', 'Your credit report contains detailed information about your credit history...', 'beginner', 7),
('Debt Validation Process', 'article', 'dispute_process', 'When dealing with debt collectors, you have the right to request validation...', 'intermediate', 8);

-- Insert sample social media content calendar
INSERT INTO content_calendar (theme, post_content, platform_targets, post_date, time_slot) VALUES
('Financial Literacy Monday', 'Did you know you have the right to dispute any inaccurate information on your credit report for FREE? The FCRA protects consumers! #CreditRights #FinancialLiteracy', '["facebook", "twitter", "linkedin"]', CURRENT_DATE + INTERVAL '1 day', '09:00:00'),
('Legal Tip Tuesday', 'Debt collectors must provide validation when requested. Know your FDCPA rights! #DebtValidation #ConsumerRights', '["facebook", "twitter", "linkedin", "instagram"]', CURRENT_DATE + INTERVAL '2 days', '10:00:00'),
('Wisdom Wednesday', 'Your credit score is not permanent. With the right knowledge and persistence, you can improve it! #CreditRepair #FinancialWisdom', '["facebook", "instagram", "linkedin"]', CURRENT_DATE + INTERVAL '3 days', '11:00:00');

-- Insert sample data sources for live feeds
INSERT INTO data_sources (source_name, source_type, source_url, refresh_interval) VALUES
('CFPB Blog Feed', 'rss', 'https://www.consumerfinance.gov/about-us/blog/feed/', 86400),
('FTC Press Releases', 'rss', 'https://www.ftc.gov/news-events/press-releases/rss.xml', 86400),
('Congress.gov Bills', 'api', 'https://api.congress.gov/v3/bill', 86400),
('OpenStates Legislation', 'api', 'https://v3.openstates.org/bills', 86400);

-- ========== VIEWS FOR REPORTING ==========

-- Enforcement Dashboard View
CREATE VIEW enforcement_dashboard AS
SELECT 
    c.id as client_id,
    c.first_name,
    c.last_name,
    c.email,
    ecs.stage_name as current_stage,
    ecs.stage_order,
    cep.stage_status,
    cep.started_at,
    cep.completed_at,
    COUNT(d.id) as total_disputes,
    COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes,
    c.credit_score
FROM clients c
LEFT JOIN client_enforcement_progress cep ON c.id = cep.client_id
LEFT JOIN enforcement_chain_stages ecs ON cep.current_stage_id = ecs.id
LEFT JOIN disputes d ON c.id = d.client_id
GROUP BY c.id, c.first_name, c.last_name, c.email, ecs.stage_name, ecs.stage_order, cep.stage_status, cep.started_at, cep.completed_at, c.credit_score;

-- Client Progress Summary View
CREATE VIEW client_progress_summary AS
SELECT 
    c.id as client_id,
    c.first_name || ' ' || c.last_name as full_name,
    c.email,
    c.credit_score,
    COUNT(DISTINCT d.id) as total_disputes,
    COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) as resolved_disputes,
    COUNT(DISTINCT gl.id) as letters_sent,
    COUNT(DISTINCT cba.id) as bureau_actions,
    ecs.stage_name as current_enforcement_stage,
    cep.started_at as stage_started,
    c.created_at as client_since
FROM clients c
LEFT JOIN disputes d ON c.id = d.client_id
LEFT JOIN generated_letters gl ON c.id = gl.client_id
LEFT JOIN client_bureau_actions cba ON c.id = cba.client_id
LEFT JOIN client_enforcement_progress cep ON c.id = cep.client_id AND cep.stage_status = 'in_progress'
LEFT JOIN enforcement_chain_stages ecs ON cep.current_stage_id = ecs.id
GROUP BY c.id, c.first_name, c.last_name, c.email, c.credit_score, ecs.stage_name, cep.started_at, c.created_at;

-- ========== AUTOMATION FUNCTIONS ==========

-- Function to advance clients through enforcement stages
CREATE OR REPLACE FUNCTION advance_enforcement_stage(client_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_progress RECORD;
    next_stage RECORD;
BEGIN
    -- Get current progress
    SELECT * INTO current_progress 
    FROM client_enforcement_progress 
    WHERE client_id = client_uuid AND stage_status = 'in_progress';
    
    IF NOT FOUND THEN
        -- Start with first stage
        SELECT * INTO next_stage 
        FROM enforcement_chain_stages 
        ORDER BY stage_order ASC 
        LIMIT 1;
        
        INSERT INTO client_enforcement_progress (client_id, current_stage_id, stage_status)
        VALUES (client_uuid, next_stage.id, 'in_progress');
        
        RETURN TRUE;
    END IF;
    
    -- Mark current stage as completed
    UPDATE client_enforcement_progress 
    SET stage_status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = current_progress.id;
    
    -- Get next stage
    SELECT * INTO next_stage 
    FROM enforcement_chain_stages ecs
    WHERE ecs.stage_order > (
        SELECT stage_order 
        FROM enforcement_chain_stages 
        WHERE id = current_progress.current_stage_id
    )
    ORDER BY ecs.stage_order ASC 
    LIMIT 1;
    
    IF FOUND THEN
        -- Start next stage
        INSERT INTO client_enforcement_progress (client_id, current_stage_id, stage_status)
        VALUES (client_uuid, next_stage.id, 'in_progress');
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to log compliance actions
CREATE OR REPLACE FUNCTION log_compliance_action(
    p_user_id UUID,
    p_client_id UUID,
    p_action_type VARCHAR(100),
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_description TEXT,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO compliance_audit_log (
        user_id, client_id, action_type, entity_type, entity_id, 
        action_description, compliance_status, risk_level, ip_address
    ) VALUES (
        p_user_id, p_client_id, p_action_type, p_entity_type, p_entity_id,
        p_description, 'compliant', 'low', p_ip_address
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ========== COMPLETION MESSAGE ==========

-- Add a comment to track migration completion
COMMENT ON SCHEMA public IS 'Supreme Credit Enforcement Chain™ - Complete database schema with Metro 2 compliance, law libraries, enforcement automation, social media management, AI predictions, and comprehensive audit logging. Rick Jefferson AI Master System - Ready for production deployment.';