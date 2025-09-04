-- Credit Repair Platform Database Schema
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and staff management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'client')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    phone VARCHAR(20),
    last_login TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token blacklist for logout functionality
CREATE TABLE token_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table for credit repair customers
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    ssn_encrypted TEXT, -- Encrypted SSN
    date_of_birth DATE,
    address JSONB, -- Store full address as JSON
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    credit_score INTEGER,
    credit_report_date DATE,
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disputes table for credit repair disputes
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    bureau VARCHAR(20) NOT NULL CHECK (bureau IN ('experian', 'equifax', 'transunion')),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100),
    dispute_reason TEXT NOT NULL,
    dispute_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'investigating', 'resolved', 'rejected')),
    instructions TEXT,
    success_probability DECIMAL(5,2), -- AI-predicted success probability
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    submitted_date DATE,
    response_date DATE,
    resolution_date DATE,
    outcome TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Letters table for dispute letters
CREATE TABLE letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    letter_type VARCHAR(20) NOT NULL CHECK (letter_type IN ('initial', 'follow_up', 'escalation', 'final', 'custom')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'delivered', 'failed')),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    recipient_name VARCHAR(255),
    recipient_address JSONB,
    recipient_email VARCHAR(255),
    send_method VARCHAR(20) CHECK (send_method IN ('email', 'mail', 'fax')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    tracking_number VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Letter templates for automated generation
CREATE TABLE letter_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    dispute_type VARCHAR(50) NOT NULL,
    letter_type VARCHAR(20) NOT NULL CHECK (letter_type IN ('initial', 'follow_up', 'escalation', 'final')),
    content TEXT NOT NULL,
    variables JSONB, -- Template variables and their descriptions
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Letter tracking for delivery status
CREATE TABLE letter_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table for file uploads
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(50),
    description TEXT,
    is_confidential BOOLEAN DEFAULT FALSE,
    file_hash VARCHAR(64), -- SHA-256 hash for duplicate detection
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table for billing
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'professional', 'enterprise')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    amount DECIMAL(10,2) NOT NULL,
    next_billing_date DATE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table for transaction records
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'manual', 'check', 'wire')),
    transaction_id VARCHAR(255),
    description TEXT,
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table for audit trail and timeline
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit reports table for storing credit report data
CREATE TABLE credit_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    bureau VARCHAR(20) NOT NULL CHECK (bureau IN ('experian', 'equifax', 'transunion')),
    report_date DATE NOT NULL,
    credit_score INTEGER,
    report_data JSONB, -- Store full credit report as JSON
    accounts JSONB, -- Credit accounts array
    inquiries JSONB, -- Credit inquiries array
    public_records JSONB, -- Public records array
    file_path VARCHAR(500), -- Path to PDF report file
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI insights table for storing ML predictions and recommendations
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(5,2),
    predictions JSONB,
    recommendations JSONB,
    model_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table for system notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table for configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Clients indexes
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Disputes indexes
CREATE INDEX idx_disputes_client_id ON disputes(client_id);
CREATE INDEX idx_disputes_bureau ON disputes(bureau);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_at ON disputes(created_at);
CREATE INDEX idx_disputes_priority ON disputes(priority);

-- Letters indexes
CREATE INDEX idx_letters_dispute_id ON letters(dispute_id);
CREATE INDEX idx_letters_status ON letters(status);
CREATE INDEX idx_letters_letter_type ON letters(letter_type);
CREATE INDEX idx_letters_created_at ON letters(created_at);

-- Documents indexes
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_dispute_id ON documents(dispute_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_file_hash ON documents(file_hash);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_client_id ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- Payments indexes
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- Activities indexes
CREATE INDEX idx_activities_client_id ON activities(client_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- Credit reports indexes
CREATE INDEX idx_credit_reports_client_id ON credit_reports(client_id);
CREATE INDEX idx_credit_reports_bureau ON credit_reports(bureau);
CREATE INDEX idx_credit_reports_report_date ON credit_reports(report_date);

-- AI insights indexes
CREATE INDEX idx_ai_insights_client_id ON ai_insights(client_id);
CREATE INDEX idx_ai_insights_dispute_id ON ai_insights(dispute_id);
CREATE INDEX idx_ai_insights_insight_type ON ai_insights(insight_type);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Token blacklist indexes
CREATE INDEX idx_token_blacklist_token_hash ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Triggers for updated_at timestamps

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_letters_updated_at BEFORE UPDATE ON letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_reports_updated_at BEFORE UPDATE ON credit_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_letter_templates_updated_at BEFORE UPDATE ON letter_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Client summary view
CREATE VIEW client_summary AS
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.status,
    c.credit_score,
    c.created_at,
    COUNT(d.id) as total_disputes,
    COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes,
    COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as pending_disputes,
    MAX(d.created_at) as last_dispute_date,
    COUNT(s.id) as active_subscriptions,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_paid
FROM clients c
LEFT JOIN disputes d ON c.id = d.client_id
LEFT JOIN subscriptions s ON c.id = s.client_id AND s.status = 'active'
LEFT JOIN payments p ON c.id = p.client_id
WHERE c.status != 'deleted'
GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.status, c.credit_score, c.created_at;

-- Dispute analytics view
CREATE VIEW dispute_analytics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    bureau,
    status,
    dispute_type,
    COUNT(*) as dispute_count,
    AVG(success_probability) as avg_success_probability,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
FROM disputes
GROUP BY DATE_TRUNC('month', created_at), bureau, status, dispute_type;

-- Revenue analytics view
CREATE VIEW revenue_analytics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    payment_method,
    status,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM payments
GROUP BY DATE_TRUNC('month', created_at), payment_method, status;

-- Insert default admin user (password: admin123 - should be changed immediately)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'admin@creditrepair.com',
    '$2b$10$rQZ8kHWKQVnqVQZ8kHWKQVnqVQZ8kHWKQVnqVQZ8kHWKQVnqVQZ8k', -- bcrypt hash for 'admin123'
    'System',
    'Administrator',
    'admin',
    TRUE
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('company_name', 'Elite Credit Repair', 'string', 'Company name displayed in letters and documents', TRUE),
('company_address', '{"street": "123 Business Ave", "city": "Business City", "state": "BC", "zipCode": "12345"}', 'json', 'Company address for correspondence', FALSE),
('company_phone', '(555) 123-4567', 'string', 'Company phone number', TRUE),
('company_email', 'info@creditrepair.com', 'string', 'Company email address', TRUE),
('max_disputes_per_client', '50', 'number', 'Maximum disputes allowed per client', FALSE),
('ai_enhancement_enabled', 'true', 'boolean', 'Enable AI enhancement for letters', FALSE),
('auto_send_letters', 'false', 'boolean', 'Automatically send generated letters', FALSE),
('credit_monitoring_enabled', 'true', 'boolean', 'Enable credit monitoring features', FALSE),
('stripe_webhook_secret', '', 'string', 'Stripe webhook endpoint secret', FALSE),
('email_notifications_enabled', 'true', 'boolean', 'Enable email notifications', FALSE);

-- Insert default letter templates
INSERT INTO letter_templates (name, dispute_type, letter_type, content, variables) VALUES
(
    'Not Mine - Initial',
    'not_mine',
    'initial',
    'Dear Credit Bureau,\n\nI am writing to dispute the following item on my credit report:\n\nAccount Name: {{accountName}}\nAccount Number: {{accountNumber}}\n\nThis account does not belong to me. I have never opened an account with this creditor, and I do not recognize this debt. I am requesting that this item be removed from my credit report immediately.\n\nPlease investigate this matter and provide me with written confirmation of the removal.\n\nSincerely,\n{{clientName}}',
    '{"accountName": "Name of the account/creditor", "accountNumber": "Account number if available", "clientName": "Client full name"}'
),
(
    'Paid in Full - Initial',
    'paid_in_full',
    'initial',
    'Dear Credit Bureau,\n\nI am writing to dispute the following item on my credit report:\n\nAccount Name: {{accountName}}\nAccount Number: {{accountNumber}}\n\nThis account has been paid in full and should be updated to reflect a zero balance or removed from my credit report. I have fulfilled all obligations related to this account.\n\nPlease investigate this matter and update my credit report accordingly.\n\nSincerely,\n{{clientName}}',
    '{"accountName": "Name of the account/creditor", "accountNumber": "Account number if available", "clientName": "Client full name"}'
),
(
    'Identity Theft - Initial',
    'identity_theft',
    'initial',
    'Dear Credit Bureau,\n\nI am writing to dispute the following fraudulent item on my credit report:\n\nAccount Name: {{accountName}}\nAccount Number: {{accountNumber}}\n\nThis account was opened as a result of identity theft. I did not authorize the opening of this account, and I am not responsible for any charges or debts associated with it.\n\nI have filed a police report and am requesting that this fraudulent account be removed from my credit report immediately.\n\nSincerely,\n{{clientName}}',
    '{"accountName": "Name of the account/creditor", "accountNumber": "Account number if available", "clientName": "Client full name"}'
);

-- Create cleanup function for old token blacklist entries
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate dispute success rate
CREATE OR REPLACE FUNCTION calculate_success_rate(client_uuid UUID DEFAULT NULL, bureau_name VARCHAR DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
    total_disputes INTEGER;
    resolved_disputes INTEGER;
    success_rate DECIMAL;
BEGIN
    -- Build query based on parameters
    IF client_uuid IS NOT NULL AND bureau_name IS NOT NULL THEN
        SELECT COUNT(*), COUNT(CASE WHEN status = 'resolved' THEN 1 END)
        INTO total_disputes, resolved_disputes
        FROM disputes
        WHERE client_id = client_uuid AND bureau = bureau_name;
    ELSIF client_uuid IS NOT NULL THEN
        SELECT COUNT(*), COUNT(CASE WHEN status = 'resolved' THEN 1 END)
        INTO total_disputes, resolved_disputes
        FROM disputes
        WHERE client_id = client_uuid;
    ELSIF bureau_name IS NOT NULL THEN
        SELECT COUNT(*), COUNT(CASE WHEN status = 'resolved' THEN 1 END)
        INTO total_disputes, resolved_disputes
        FROM disputes
        WHERE bureau = bureau_name;
    ELSE
        SELECT COUNT(*), COUNT(CASE WHEN status = 'resolved' THEN 1 END)
        INTO total_disputes, resolved_disputes
        FROM disputes;
    END IF;
    
    -- Calculate success rate
    IF total_disputes > 0 THEN
        success_rate := (resolved_disputes::DECIMAL / total_disputes::DECIMAL) * 100;
    ELSE
        success_rate := 0;
    END IF;
    
    RETURN ROUND(success_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'System users including staff and administrators';
COMMENT ON TABLE clients IS 'Credit repair clients and their personal information';
COMMENT ON TABLE disputes IS 'Credit disputes filed on behalf of clients';
COMMENT ON TABLE letters IS 'Dispute letters generated and sent to credit bureaus';
COMMENT ON TABLE documents IS 'File uploads related to clients and disputes';
COMMENT ON TABLE subscriptions IS 'Client subscription plans and billing information';
COMMENT ON TABLE payments IS 'Payment transactions and billing records';
COMMENT ON TABLE activities IS 'Audit trail of all system activities';
COMMENT ON TABLE credit_reports IS 'Credit reports and scores from various bureaus';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and predictions';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE system_settings IS 'Application configuration settings';

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO credit_repair_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO credit_repair_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO credit_repair_app;