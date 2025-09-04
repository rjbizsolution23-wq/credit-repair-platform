-- Enhanced Credit Repair Platform Database Schema Additions
-- Additional modules for comprehensive business operations

-- =====================================================
-- STAFF MANAGEMENT MODULE
-- =====================================================

-- Staff territories for agent management
CREATE TABLE staff_territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    zip_codes TEXT[], -- Array of zip codes covered
    states VARCHAR(2)[], -- Array of state codes
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff assignments to territories
CREATE TABLE staff_territory_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    territory_id UUID NOT NULL REFERENCES staff_territories(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, territory_id)
);

-- Performance tracking for staff
CREATE TABLE staff_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    clients_acquired INTEGER DEFAULT 0,
    disputes_filed INTEGER DEFAULT 0,
    disputes_resolved INTEGER DEFAULT 0,
    revenue_generated DECIMAL(12,2) DEFAULT 0,
    client_satisfaction_score DECIMAL(3,2), -- 1-5 scale
    performance_score DECIMAL(5,2), -- Overall performance score
    goals_met INTEGER DEFAULT 0,
    goals_total INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commission structure and calculations
CREATE TABLE commission_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    structure_type VARCHAR(20) NOT NULL CHECK (structure_type IN ('percentage', 'flat_rate', 'tiered', 'hybrid')),
    base_rate DECIMAL(5,2), -- Base commission rate or amount
    tier_rules JSONB, -- Tiered commission rules
    bonus_rules JSONB, -- Bonus calculation rules
    minimum_threshold DECIMAL(10,2), -- Minimum to qualify for commission
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff commission assignments
CREATE TABLE staff_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commission_structure_id UUID NOT NULL REFERENCES commission_structures(id),
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commission calculations and payouts
CREATE TABLE commission_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_commission DECIMAL(10,2) DEFAULT 0,
    bonus_commission DECIMAL(10,2) DEFAULT 0,
    total_commission DECIMAL(10,2) NOT NULL,
    revenue_basis DECIMAL(12,2) NOT NULL, -- Revenue used for calculation
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
    payment_date DATE,
    payment_method VARCHAR(20),
    payment_reference VARCHAR(100),
    notes TEXT,
    calculated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CLIENT PORTAL MODULE
-- =====================================================

-- Client portal access and preferences
CREATE TABLE client_portal_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    portal_enabled BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    password_hash VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    preferences JSONB, -- Portal preferences and settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client document uploads through portal
CREATE TABLE client_document_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    upload_session_id UUID,
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
    upload_progress INTEGER DEFAULT 0, -- Percentage
    error_message TEXT,
    uploaded_via VARCHAR(20) DEFAULT 'portal' CHECK (uploaded_via IN ('portal', 'mobile', 'email')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client progress tracking
CREATE TABLE client_progress_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL,
    milestone_name VARCHAR(100) NOT NULL,
    description TEXT,
    target_date DATE,
    completion_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    progress_percentage INTEGER DEFAULT 0,
    metadata JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ENHANCED BILLING & PAYMENTS MODULE
-- =====================================================

-- Subscription plans with detailed features
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'professional', 'enterprise', 'custom')),
    price_monthly DECIMAL(10,2) NOT NULL,
    price_quarterly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB, -- Plan features and limits
    max_disputes INTEGER,
    max_users INTEGER,
    includes_ai BOOLEAN DEFAULT FALSE,
    includes_monitoring BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced subscription management
CREATE TABLE subscription_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'pause', 'resume', 'cancel')),
    old_plan_type VARCHAR(20),
    new_plan_type VARCHAR(20),
    old_amount DECIMAL(10,2),
    new_amount DECIMAL(10,2),
    effective_date DATE NOT NULL,
    reason TEXT,
    proration_amount DECIMAL(10,2),
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice generation and management
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
    payment_terms VARCHAR(50),
    notes TEXT,
    pdf_path VARCHAR(500),
    sent_date DATE,
    paid_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice line items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    item_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AFFILIATE/REFERRAL MODULE
-- =====================================================

-- Affiliate partners
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200),
    contact_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL, -- Percentage
    payment_terms VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
    contract_start_date DATE,
    contract_end_date DATE,
    payment_method VARCHAR(50),
    payment_details JSONB, -- Bank details, PayPal, etc.
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referral tracking
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id),
    referrer_type VARCHAR(20) NOT NULL CHECK (referrer_type IN ('affiliate', 'client', 'staff', 'other')),
    referrer_id UUID, -- Can reference different tables based on type
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    referral_code VARCHAR(50),
    referral_source VARCHAR(100), -- Website, social media, etc.
    conversion_date DATE,
    commission_amount DECIMAL(10,2),
    commission_paid BOOLEAN DEFAULT FALSE,
    commission_paid_date DATE,
    lifetime_value DECIMAL(12,2), -- Total value from referred client
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead management
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    source VARCHAR(100), -- Where lead came from
    referral_id UUID REFERENCES referrals(id),
    affiliate_id UUID REFERENCES affiliates(id),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    lead_score INTEGER DEFAULT 0, -- 0-100 scoring
    interest_level VARCHAR(20) CHECK (interest_level IN ('low', 'medium', 'high')),
    budget_range VARCHAR(50),
    timeline VARCHAR(50),
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    converted_to_client_id UUID REFERENCES clients(id),
    conversion_date DATE,
    last_contact_date DATE,
    next_follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- WORKFLOW ENGINE MODULE
-- =====================================================

-- Workflow definitions
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(50) NOT NULL, -- dispute_processing, client_onboarding, etc.
    trigger_conditions JSONB NOT NULL, -- Conditions that start the workflow
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow steps/actions
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- action, condition, delay, approval
    action_config JSONB NOT NULL, -- Configuration for the action
    conditions JSONB, -- Conditions for step execution
    delay_config JSONB, -- Delay configuration if applicable
    approval_required BOOLEAN DEFAULT FALSE,
    approval_roles VARCHAR(50)[],
    timeout_minutes INTEGER,
    retry_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow executions
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    entity_type VARCHAR(50) NOT NULL, -- client, dispute, etc.
    entity_id UUID NOT NULL, -- ID of the entity being processed
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused', 'cancelled')),
    current_step_id UUID REFERENCES workflow_steps(id),
    started_by UUID REFERENCES users(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    execution_data JSONB, -- Runtime data for the workflow
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow step executions
CREATE TABLE workflow_step_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    output_data JSONB,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ENHANCED NOTIFICATION SYSTEM
-- =====================================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- email, sms, push, in_app
    event_type VARCHAR(100) NOT NULL, -- dispute_resolved, payment_due, etc.
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_type),
    UNIQUE(client_id, event_type)
);

-- Notification queue for processing
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'client')),
    recipient_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    template_id UUID REFERENCES notification_templates(id),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('email', 'sms', 'push', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BUSINESS INTELLIGENCE MODULE
-- =====================================================

-- KPI definitions and tracking
CREATE TABLE kpi_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- revenue, performance, client_satisfaction, etc.
    calculation_method TEXT NOT NULL, -- SQL query or formula
    target_value DECIMAL(15,4),
    unit VARCHAR(20), -- percentage, dollars, count, etc.
    frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI values tracking
CREATE TABLE kpi_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    variance_percentage DECIMAL(5,2),
    metadata JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculated_by UUID REFERENCES users(id)
);

-- Client lifecycle analytics
CREATE TABLE client_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- acquisition, onboarding, first_dispute, churn, etc.
    event_date DATE NOT NULL,
    event_value DECIMAL(10,2), -- Monetary value if applicable
    acquisition_cost DECIMAL(10,2),
    acquisition_channel VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SUPPORT TICKETING MODULE
-- =====================================================

-- Support ticket categories
CREATE TABLE support_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES support_categories(id),
    priority_default VARCHAR(10) DEFAULT 'medium' CHECK (priority_default IN ('low', 'medium', 'high', 'urgent')),
    sla_hours INTEGER DEFAULT 24, -- Service level agreement in hours
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Internal user if applicable
    category_id UUID REFERENCES support_categories(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_client', 'waiting_internal', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id),
    source VARCHAR(20) DEFAULT 'portal' CHECK (source IN ('portal', 'email', 'phone', 'chat', 'internal')),
    resolution TEXT,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    satisfaction_feedback TEXT,
    due_date TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support ticket responses/comments
CREATE TABLE support_ticket_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    response_type VARCHAR(20) DEFAULT 'comment' CHECK (response_type IN ('comment', 'internal_note', 'status_change', 'assignment')),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    is_solution BOOLEAN DEFAULT FALSE,
    attachments JSONB, -- File attachments
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- EDUCATIONAL PLATFORM MODULE
-- =====================================================

-- Course categories
CREATE TABLE course_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES course_categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    learning_objectives TEXT[],
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration_minutes INTEGER,
    is_certification BOOLEAN DEFAULT FALSE,
    certification_points INTEGER DEFAULT 0,
    prerequisites UUID[], -- Array of course IDs
    thumbnail_url VARCHAR(500),
    is_published BOOLEAN DEFAULT FALSE,
    publish_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course modules/lessons
CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    module_order INTEGER NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'text', 'quiz', 'interactive', 'download')),
    content_data JSONB NOT NULL, -- Content configuration
    duration_minutes INTEGER,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student enrollments
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    progress_percentage INTEGER DEFAULT 0,
    current_module_id UUID REFERENCES course_modules(id),
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
    final_score DECIMAL(5,2),
    certification_earned BOOLEAN DEFAULT FALSE,
    certification_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((client_id IS NOT NULL AND user_id IS NULL) OR (client_id IS NULL AND user_id IS NOT NULL))
);

-- Student progress tracking
CREATE TABLE course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECURITY & COMPLIANCE MODULE
-- =====================================================

-- Security audit logs
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    event_type VARCHAR(50) NOT NULL, -- login, logout, password_change, data_access, etc.
    event_category VARCHAR(20) NOT NULL CHECK (event_category IN ('authentication', 'authorization', 'data_access', 'system', 'compliance')),
    severity VARCHAR(10) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    resource_accessed VARCHAR(255),
    action_performed VARCHAR(100),
    success BOOLEAN DEFAULT TRUE,
    risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data privacy consent management
CREATE TABLE privacy_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- data_processing, marketing, analytics, etc.
    consent_version VARCHAR(10) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP NOT NULL,
    consent_method VARCHAR(20) NOT NULL, -- website, email, phone, paper
    consent_ip INET,
    withdrawal_date TIMESTAMP,
    withdrawal_reason TEXT,
    legal_basis VARCHAR(50), -- GDPR legal basis
    retention_period_months INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data subject requests (GDPR/CCPA)
CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'verified', 'processing', 'completed', 'rejected')),
    request_date DATE NOT NULL,
    verification_method VARCHAR(50),
    verified_date DATE,
    completion_date DATE,
    rejection_reason TEXT,
    requester_name VARCHAR(200),
    requester_email VARCHAR(255),
    requester_phone VARCHAR(20),
    identity_verification JSONB,
    response_data JSONB,
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup and recovery tracking
CREATE TABLE backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_scope VARCHAR(50) NOT NULL, -- database, files, system, etc.
    status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    backup_size_bytes BIGINT,
    backup_location VARCHAR(500),
    backup_filename VARCHAR(255),
    checksum VARCHAR(64),
    compression_ratio DECIMAL(5,2),
    error_message TEXT,
    retention_date DATE, -- When backup can be deleted
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Staff Management Indexes
CREATE INDEX idx_staff_territories_zip_codes ON staff_territories USING GIN(zip_codes);
CREATE INDEX idx_staff_territories_states ON staff_territories USING GIN(states);
CREATE INDEX idx_staff_territory_assignments_user_id ON staff_territory_assignments(user_id);
CREATE INDEX idx_staff_territory_assignments_territory_id ON staff_territory_assignments(territory_id);
CREATE INDEX idx_staff_performance_user_id ON staff_performance(user_id);
CREATE INDEX idx_staff_performance_period ON staff_performance(period_start, period_end);
CREATE INDEX idx_commission_payouts_user_id ON commission_payouts(user_id);
CREATE INDEX idx_commission_payouts_period ON commission_payouts(period_start, period_end);
CREATE INDEX idx_commission_payouts_status ON commission_payouts(status);

-- Client Portal Indexes
CREATE INDEX idx_client_portal_access_client_id ON client_portal_access(client_id);
CREATE INDEX idx_client_document_uploads_client_id ON client_document_uploads(client_id);
CREATE INDEX idx_client_document_uploads_status ON client_document_uploads(upload_status);
CREATE INDEX idx_client_progress_milestones_client_id ON client_progress_milestones(client_id);
CREATE INDEX idx_client_progress_milestones_status ON client_progress_milestones(status);

-- Billing Indexes
CREATE INDEX idx_subscription_plans_plan_type ON subscription_plans(plan_type);
CREATE INDEX idx_subscription_changes_subscription_id ON subscription_changes(subscription_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- Affiliate/Referral Indexes
CREATE INDEX idx_affiliates_affiliate_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_referrals_affiliate_id ON referrals(affiliate_id);
CREATE INDEX idx_referrals_client_id ON referrals(client_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_source ON leads(source);

-- Workflow Indexes
CREATE INDEX idx_workflows_workflow_type ON workflows(workflow_type);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);

-- Notification Indexes
CREATE INDEX idx_notification_templates_event_type ON notification_templates(event_type);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_client_id ON notification_preferences(client_id);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_recipient ON notification_queue(recipient_type, recipient_id);

-- Business Intelligence Indexes
CREATE INDEX idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX idx_kpi_values_kpi_definition_id ON kpi_values(kpi_definition_id);
CREATE INDEX idx_kpi_values_period ON kpi_values(period_start, period_end);
CREATE INDEX idx_client_lifecycle_events_client_id ON client_lifecycle_events(client_id);
CREATE INDEX idx_client_lifecycle_events_event_type ON client_lifecycle_events(event_type);

-- Support Indexes
CREATE INDEX idx_support_tickets_client_id ON support_tickets(client_id);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_ticket_responses_ticket_id ON support_ticket_responses(ticket_id);

-- Education Indexes
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_client_id ON course_enrollments(client_id);
CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX idx_course_progress_enrollment_id ON course_progress(enrollment_id);

-- Security Indexes
CREATE INDEX idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX idx_privacy_consents_client_id ON privacy_consents(client_id);
CREATE INDEX idx_data_subject_requests_client_id ON data_subject_requests(client_id);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_backup_logs_backup_type ON backup_logs(backup_type);
CREATE INDEX idx_backup_logs_status ON backup_logs(status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_staff_territories_updated_at BEFORE UPDATE ON staff_territories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_performance_updated_at BEFORE UPDATE ON staff_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_structures_updated_at BEFORE UPDATE ON commission_structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_payouts_updated_at BEFORE UPDATE ON commission_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_portal_access_updated_at BEFORE UPDATE ON client_portal_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_document_uploads_updated_at BEFORE UPDATE ON client_document_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_progress_milestones_updated_at BEFORE UPDATE ON client_progress_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kpi_definitions_updated_at BEFORE UPDATE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_progress_updated_at BEFORE UPDATE ON course_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_subject_requests_updated_at BEFORE UPDATE ON data_subject_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENHANCED VIEWS FOR ANALYTICS
-- =====================================================

-- Staff performance summary view
CREATE VIEW staff_performance_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT d.id) as total_disputes,
    COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) as resolved_disputes,
    COALESCE(AVG(sp.performance_score), 0) as avg_performance_score,
    COALESCE(SUM(sp.revenue_generated), 0) as total_revenue_generated,
    COALESCE(SUM(cp.total_commission), 0) as total_commissions_earned
FROM users u
LEFT JOIN clients c ON u.id = c.assigned_to
LEFT JOIN disputes d ON c.id = d.client_id
LEFT JOIN staff_performance sp ON u.id = sp.user_id
LEFT JOIN commission_payouts cp ON u.id = cp.user_id AND cp.status = 'paid'
WHERE u.role IN ('staff', 'manager')
GROUP BY u.id, u.first_name, u.last_name, u.email;

-- Revenue analytics enhanced view
CREATE VIEW revenue_analytics_enhanced AS
SELECT 
    DATE_TRUNC('month', p.created_at) as month,
    COUNT(DISTINCT p.client_id) as unique_clients,
    COUNT(p.id) as total_transactions,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as completed_revenue,
    SUM(CASE WHEN p.status = 'failed' THEN p.amount ELSE 0 END) as failed_revenue,
    AVG(CASE WHEN p.status = 'completed' THEN p.amount END) as avg_transaction_amount,
    COUNT(CASE WHEN p.payment_method = 'stripe' THEN 1 END) as stripe_payments,
    COUNT(CASE WHEN p.payment_method = 'manual' THEN 1 END) as manual_payments
FROM payments p
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY month DESC;

-- Client lifecycle analytics view
CREATE VIEW client_lifecycle_analytics AS
SELECT 
    c.id as client_id,
    c.first_name,
    c.last_name,
    c.created_at as acquisition_date,
    MIN(cle.event_date) FILTER (WHERE cle.event_type = 'onboarding') as onboarding_date,
    MIN(d.created_at) as first_dispute_date,
    COUNT(d.id) as total_disputes,
    COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as lifetime_value,
    COALESCE(AVG(cle.acquisition_cost), 0) as acquisition_cost,
    CASE 
        WHEN MAX(a.created_at) < CURRENT_DATE - INTERVAL '90 days' THEN 'churned'
        WHEN MAX(a.created_at) < CURRENT_DATE - INTERVAL '30 days' THEN 'at_risk'
        ELSE 'active'
    END as status
FROM clients c
LEFT JOIN client_lifecycle_events cle ON c.id = cle.client_id
LEFT JOIN disputes d ON c.id = d.client_id
LEFT JOIN payments p ON c.id = p.client_id
LEFT JOIN activities a ON c.id = a.client_id
WHERE c.status != 'deleted'
GROUP BY c.id, c.first_name, c.last_name, c.created_at;

-- Support ticket analytics view
CREATE VIEW support_ticket_analytics AS
SELECT 
    DATE_TRUNC('week', st.created_at) as week,
    sc.name as category,
    st.priority,
    COUNT(*) as ticket_count,
    COUNT(CASE WHEN st.status = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN st.status = 'closed' THEN 1 END) as closed_count,
    AVG(EXTRACT(EPOCH FROM (st.resolved_at - st.created_at))/3600) as avg_resolution_hours,
    AVG(st.satisfaction_rating) as avg_satisfaction
FROM support_tickets st
LEFT JOIN support_categories sc ON st.category_id = sc.id
GROUP BY DATE_TRUNC('week', st.created_at), sc.name, st.priority
ORDER BY week DESC;

-- =====================================================
-- SAMPLE DATA INSERTS
-- =====================================================

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, plan_type, price_monthly, price_quarterly, price_yearly, features, max_disputes, max_users, includes_ai, includes_monitoring) VALUES
('Basic Plan', 'Essential credit repair features', 'basic', 79.99, 199.99, 699.99, '{"features": ["Basic dispute letters", "Credit monitoring", "Email support"]}', 10, 1, FALSE, TRUE),
('Professional Plan', 'Advanced features for serious credit repair', 'professional', 149.99, 399.99, 1399.99, '{"features": ["AI-enhanced letters", "Advanced analytics", "Priority support", "Mobile app"]}', 50, 3, TRUE, TRUE),
('Enterprise Plan', 'Full-featured plan for businesses', 'enterprise', 299.99, 799.99, 2799.99, '{"features": ["Unlimited disputes", "White-label portal", "API access", "Dedicated support"]}', -1, -1, TRUE, TRUE);

-- Insert sample commission structures
INSERT INTO commission_structures (name, structure_type, base_rate, tier_rules, effective_date) VALUES
('Standard Sales Commission', 'percentage', 10.00, '{"tiers": [{"min": 0, "max": 5000, "rate": 10}, {"min": 5001, "max": 10000, "rate": 12}, {"min": 10001, "rate": 15}]}', CURRENT_DATE),
('Manager Bonus Structure', 'hybrid', 5.00, '{"base_rate": 5, "team_bonus": 2, "performance_multiplier": 1.5}', CURRENT_DATE);

-- Insert sample notification templates
INSERT INTO notification_templates (name, template_type, event_type, subject_template, body_template, variables) VALUES
('Dispute Resolved Email', 'email', 'dispute_resolved', 'Great News! Your {{dispute_type}} dispute has been resolved', 'Dear {{client_name}},\n\nWe have great news! Your dispute regarding {{account_name}} has been successfully resolved.\n\nNext steps: {{next_steps}}\n\nBest regards,\nYour Credit Repair Team', '{"client_name": "Client full name", "dispute_type": "Type of dispute", "account_name": "Account name", "next_steps": "Recommended next actions"}'),
('Payment Due Reminder', 'email', 'payment_due', 'Payment Reminder - Invoice {{invoice_number}}', 'Dear {{client_name}},\n\nThis is a friendly reminder that your payment of ${{amount}} is due on {{due_date}}.\n\nPlease log into your portal to make a payment.\n\nThank you!', '{"client_name": "Client full name", "invoice_number": "Invoice number", "amount": "Payment amount", "due_date": "Due date"}');

-- Insert sample KPI definitions
INSERT INTO kpi_definitions (name, description, category, calculation_method, target_value, unit, frequency) VALUES
('Monthly Recurring Revenue', 'Total monthly recurring revenue from active subscriptions', 'revenue', 'SELECT SUM(amount) FROM subscriptions WHERE status = ''active'' AND billing_cycle = ''monthly''', 50000.00, 'dollars', 'monthly'),
('Dispute Success Rate', 'Percentage of disputes resolved successfully', 'performance', 'SELECT (COUNT(CASE WHEN status = ''resolved'' THEN 1 END) * 100.0 / COUNT(*)) FROM disputes WHERE created_at >= CURRENT_DATE - INTERVAL ''30 days''', 85.00, 'percentage', 'monthly'),
('Client Satisfaction Score', 'Average client satisfaction rating', 'client_satisfaction', 'SELECT AVG(satisfaction_rating) FROM support_tickets WHERE satisfaction_rating IS NOT NULL AND created_at >= CURRENT_DATE - INTERVAL ''30 days''', 4.5, 'rating', 'monthly');

-- Insert sample course categories
INSERT INTO course_categories (name, description, icon, sort_order) VALUES
('Credit Basics', 'Fundamental credit repair concepts', 'credit-card', 1),
('Dispute Strategies', 'Advanced dispute techniques', 'gavel', 2),
('Financial Planning', 'Long-term financial health', 'chart-line', 3),
('Legal Knowledge', 'Understanding credit laws and regulations', 'balance-scale', 4);

-- Insert sample support categories
INSERT INTO support_categories (name, description, priority_default, sla_hours) VALUES
('Technical Issues', 'Problems with the platform or portal', 'high', 4),
('Billing Questions', 'Payment and subscription inquiries', 'medium', 24),
('Dispute Status', 'Questions about dispute progress', 'medium', 12),
('General Inquiry', 'General questions and information requests', 'low', 48);

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to calculate staff commission
CREATE OR REPLACE FUNCTION calculate_staff_commission(
    staff_user_id UUID,
    period_start_date DATE,
    period_end_date DATE
)
RETURNS DECIMAL AS $$
DECLARE
    total_revenue DECIMAL := 0;
    commission_rate DECIMAL := 0;
    calculated_commission DECIMAL := 0;
    commission_structure RECORD;
BEGIN
    -- Get the active commission structure for the staff member
    SELECT cs.* INTO commission_structure
    FROM commission_structures cs
    JOIN staff_commissions sc ON cs.id = sc.commission_structure_id
    WHERE sc.user_id = staff_user_id
    AND sc.is_active = TRUE
    AND period_start_date BETWEEN sc.effective_date AND COALESCE(sc.expiry_date, '9999-12-31')
    ORDER BY sc.effective_date DESC
    LIMIT 1;
    
    IF commission_structure.id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate total revenue generated by this staff member
    SELECT COALESCE(SUM(p.amount), 0) INTO total_revenue
    FROM payments p
    JOIN clients c ON p.client_id = c.id
    WHERE c.assigned_to = staff_user_id
    AND p.status = 'completed'
    AND p.created_at BETWEEN period_start_date AND period_end_date;
    
    -- Calculate commission based on structure type
    IF commission_structure.structure_type = 'percentage' THEN
        calculated_commission := total_revenue * (commission_structure.base_rate / 100);
    ELSIF commission_structure.structure_type = 'flat_rate' THEN
        calculated_commission := commission_structure.base_rate;
    -- Add more complex calculations for tiered and hybrid structures as needed
    END IF;
    
    RETURN calculated_commission;
END;
$$ LANGUAGE plpgsql;

-- Function to update client progress milestones
CREATE OR REPLACE FUNCTION update_client_progress(
    client_uuid UUID,
    milestone_type_param VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
    -- Update or insert milestone progress
    INSERT INTO client_progress_milestones (client_id, milestone_type, milestone_name, status, completion_date, progress_percentage)
    VALUES (
        client_uuid,
        milestone_type_param,
        CASE milestone_type_param
            WHEN 'onboarding' THEN 'Account Setup Complete'
            WHEN 'first_dispute' THEN 'First Dispute Filed'
            WHEN 'credit_report' THEN 'Credit Report Obtained'
            ELSE 'General Milestone'
        END,
        'completed',
        CURRENT_DATE,
        100
    )
    ON CONFLICT (client_id, milestone_type) 
    DO UPDATE SET 
        status = 'completed',
        completion_date = CURRENT_DATE,
        progress_percentage = 100,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part VARCHAR(4);
    month_part VARCHAR(2);
    sequence_part VARCHAR(6);
    invoice_count INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    month_part := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::VARCHAR, 2, '0');
    
    -- Get count of invoices this month
    SELECT COUNT(*) + 1 INTO invoice_count
    FROM invoices
    WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE);
    
    sequence_part := LPAD(invoice_count::VARCHAR, 6, '0');
    
    RETURN 'INV-' || year_part || month_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Function to generate support ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part VARCHAR(8);
    ticket_count INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get count of tickets this year
    SELECT COUNT(*) + 1 INTO ticket_count
    FROM support_tickets
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    sequence_part := LPAD(ticket_count::VARCHAR, 8, '0');
    
    RETURN 'TKT-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE staff_territories IS 'Geographic territories for staff assignment and management';
COMMENT ON TABLE staff_performance IS 'Performance tracking and metrics for staff members';
COMMENT ON TABLE commission_structures IS 'Commission calculation rules and structures';
COMMENT ON TABLE commission_payouts IS 'Calculated and processed commission payments';
COMMENT ON TABLE client_portal_access IS 'Client portal access credentials and preferences';
COMMENT ON TABLE client_progress_milestones IS 'Client progress tracking and milestone management';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans with features and pricing';
COMMENT ON TABLE invoices IS 'Generated invoices for client billing';
COMMENT ON TABLE affiliates IS 'Partner affiliates for referral program';
COMMENT ON TABLE referrals IS 'Referral tracking and commission calculation';
COMMENT ON TABLE leads IS 'Lead management and conversion tracking';
COMMENT ON TABLE workflows IS 'Automated workflow definitions and rules';
COMMENT ON TABLE workflow_executions IS 'Runtime execution of automated workflows';
COMMENT ON TABLE notification_templates IS 'Templates for automated notifications';
COMMENT ON TABLE notification_queue IS 'Queue for processing outbound notifications';
COMMENT ON TABLE kpi_definitions IS 'Key Performance Indicator definitions and calculations';
COMMENT ON TABLE support_tickets IS 'Customer support ticket management';
COMMENT ON TABLE courses IS 'Educational courses for client and staff training';
COMMENT ON TABLE course_enrollments IS 'Student enrollments and progress in courses';
COMMENT ON TABLE security_audit_logs IS 'Security events and audit trail';
COMMENT ON TABLE privacy_consents IS 'GDPR/CCPA consent management';
COMMENT ON TABLE data_subject_requests IS 'Data subject rights requests (GDPR/CCPA)';
COMMENT ON TABLE backup_logs IS 'Backup and recovery operation tracking';

-- End of Enhanced Schema Additions