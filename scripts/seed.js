const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

// Sample data
const sampleUsers = [
  {
    email: 'manager@creditrepair.com',
    password: 'manager123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'manager'
  },
  {
    email: 'agent1@creditrepair.com',
    password: 'agent123',
    firstName: 'Mike',
    lastName: 'Davis',
    role: 'agent'
  },
  {
    email: 'agent2@creditrepair.com',
    password: 'agent123',
    firstName: 'Lisa',
    lastName: 'Wilson',
    role: 'agent'
  }
];

const sampleClients = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    dateOfBirth: '1985-06-15',
    ssnLastFour: '1234',
    status: 'active'
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@email.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    dateOfBirth: '1990-03-22',
    ssnLastFour: '5678',
    status: 'active'
  },
  {
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@email.com',
    phone: '(555) 456-7890',
    address: '789 Pine St',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    dateOfBirth: '1978-11-08',
    ssnLastFour: '9012',
    status: 'active'
  },
  {
    firstName: 'Emily',
    lastName: 'Garcia',
    email: 'emily.garcia@email.com',
    phone: '(555) 321-0987',
    address: '321 Elm Dr',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    dateOfBirth: '1992-07-14',
    ssnLastFour: '3456',
    status: 'active'
  },
  {
    firstName: 'David',
    lastName: 'Martinez',
    email: 'david.martinez@email.com',
    phone: '(555) 654-3210',
    address: '654 Maple Ln',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
    dateOfBirth: '1983-12-03',
    ssnLastFour: '7890',
    status: 'active'
  }
];

const sampleDisputes = [
  {
    bureau: 'Experian',
    accountName: 'Capital One Credit Card',
    accountNumber: '****1234',
    disputeReason: 'Account not mine',
    status: 'pending',
    dateFiled: '2024-01-15',
    expectedCompletion: '2024-02-14'
  },
  {
    bureau: 'Equifax',
    accountName: 'Chase Auto Loan',
    accountNumber: '****5678',
    disputeReason: 'Incorrect payment history',
    status: 'in_progress',
    dateFiled: '2024-01-10',
    expectedCompletion: '2024-02-09'
  },
  {
    bureau: 'TransUnion',
    accountName: 'Wells Fargo Mortgage',
    accountNumber: '****9012',
    disputeReason: 'Account closed but showing as open',
    status: 'resolved',
    dateFiled: '2023-12-20',
    expectedCompletion: '2024-01-19',
    actualCompletion: '2024-01-18',
    result: 'removed'
  },
  {
    bureau: 'Experian',
    accountName: 'Discover Card',
    accountNumber: '****3456',
    disputeReason: 'Duplicate account',
    status: 'pending',
    dateFiled: '2024-01-20',
    expectedCompletion: '2024-02-19'
  },
  {
    bureau: 'Equifax',
    accountName: 'Student Loan',
    accountNumber: '****7890',
    disputeReason: 'Incorrect balance',
    status: 'in_progress',
    dateFiled: '2024-01-12',
    expectedCompletion: '2024-02-11'
  }
];

const samplePayments = [
  {
    amount: 99.99,
    currency: 'USD',
    paymentMethod: 'credit_card',
    status: 'completed',
    description: 'Monthly subscription fee',
    processedAt: '2024-01-01 10:00:00'
  },
  {
    amount: 149.99,
    currency: 'USD',
    paymentMethod: 'bank_transfer',
    status: 'completed',
    description: 'Premium package upgrade',
    processedAt: '2024-01-15 14:30:00'
  },
  {
    amount: 99.99,
    currency: 'USD',
    paymentMethod: 'credit_card',
    status: 'pending',
    description: 'Monthly subscription fee'
  },
  {
    amount: 199.99,
    currency: 'USD',
    paymentMethod: 'paypal',
    status: 'completed',
    description: 'Annual subscription',
    processedAt: '2024-01-10 09:15:00'
  }
];

const sampleNotifications = [
  {
    type: 'dispute_update',
    title: 'Dispute Status Updated',
    message: 'Your dispute with Experian has been updated to In Progress.',
    priority: 'normal'
  },
  {
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Your payment of $99.99 has been successfully processed.',
    priority: 'low'
  },
  {
    type: 'document_uploaded',
    title: 'Document Uploaded',
    message: 'A new document has been uploaded to your account.',
    priority: 'normal'
  },
  {
    type: 'credit_score_update',
    title: 'Credit Score Updated',
    message: 'Your credit score has increased by 15 points!',
    priority: 'high'
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const { rows: existingUsers } = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE email != $1',
      ['admin@creditrepair.com']
    );
    
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('⚠️  Database already contains sample data. Skipping seed.');
      console.log('   Use npm run db:reset to reset the database first.');
      return;
    }
    
    await client.query('BEGIN');
    
    // Seed users
    console.log('👥 Seeding users...');
    const userIds = [];
    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, true, true) RETURNING id`,
        [user.email, hashedPassword, user.firstName, user.lastName, user.role]
      );
      userIds.push(rows[0].id);
    }
    console.log(`✅ Created ${userIds.length} users`);
    
    // Seed clients
    console.log('👤 Seeding clients...');
    const clientIds = [];
    for (let i = 0; i < sampleClients.length; i++) {
      const client_data = sampleClients[i];
      const userId = userIds[i % userIds.length]; // Distribute clients among users
      
      const { rows } = await client.query(
        `INSERT INTO clients (user_id, first_name, last_name, email, phone, address, city, state, zip_code, date_of_birth, ssn_last_four, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
          userId, client_data.firstName, client_data.lastName, client_data.email,
          client_data.phone, client_data.address, client_data.city, client_data.state,
          client_data.zipCode, client_data.dateOfBirth, client_data.ssnLastFour, client_data.status
        ]
      );
      clientIds.push(rows[0].id);
    }
    console.log(`✅ Created ${clientIds.length} clients`);
    
    // Seed disputes
    console.log('⚖️  Seeding disputes...');
    for (let i = 0; i < sampleDisputes.length; i++) {
      const dispute = sampleDisputes[i];
      const clientId = clientIds[i % clientIds.length];
      const userId = userIds[i % userIds.length];
      
      await client.query(
        `INSERT INTO disputes (client_id, user_id, bureau, account_name, account_number, dispute_reason, status, date_filed, expected_completion, actual_completion, result)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          clientId, userId, dispute.bureau, dispute.accountName, dispute.accountNumber,
          dispute.disputeReason, dispute.status, dispute.dateFiled, dispute.expectedCompletion,
          dispute.actualCompletion || null, dispute.result || null
        ]
      );
    }
    console.log(`✅ Created ${sampleDisputes.length} disputes`);
    
    // Seed payments
    console.log('💳 Seeding payments...');
    for (let i = 0; i < samplePayments.length; i++) {
      const payment = samplePayments[i];
      const clientId = clientIds[i % clientIds.length];
      const userId = userIds[i % userIds.length];
      
      await client.query(
        `INSERT INTO payments (client_id, user_id, amount, currency, payment_method, status, description, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          clientId, userId, payment.amount, payment.currency, payment.paymentMethod,
          payment.status, payment.description, payment.processedAt || null
        ]
      );
    }
    console.log(`✅ Created ${samplePayments.length} payments`);
    
    // Seed notifications
    console.log('🔔 Seeding notifications...');
    for (let i = 0; i < sampleNotifications.length; i++) {
      const notification = sampleNotifications[i];
      const userId = userIds[i % userIds.length];
      const clientId = clientIds[i % clientIds.length];
      
      await client.query(
        `INSERT INTO notifications (user_id, client_id, type, title, message, priority)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, clientId, notification.type, notification.title, notification.message, notification.priority]
      );
    }
    console.log(`✅ Created ${sampleNotifications.length} notifications`);
    
    // Seed credit reports
    console.log('📊 Seeding credit reports...');
    const bureaus = ['Experian', 'Equifax', 'TransUnion'];
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      
      for (const bureau of bureaus) {
        const creditScore = Math.floor(Math.random() * (850 - 300) + 300); // Random score between 300-850
        const reportData = {
          accounts: Math.floor(Math.random() * 20) + 5,
          inquiries: Math.floor(Math.random() * 10),
          publicRecords: Math.floor(Math.random() * 3),
          totalDebt: Math.floor(Math.random() * 50000) + 5000,
          availableCredit: Math.floor(Math.random() * 100000) + 10000
        };
        
        await client.query(
          `INSERT INTO credit_reports (client_id, bureau, credit_score, report_data)
           VALUES ($1, $2, $3, $4)`,
          [clientId, bureau, creditScore, JSON.stringify(reportData)]
        );
      }
    }
    console.log(`✅ Created credit reports for ${clientIds.length} clients`);
    
    // Seed some audit logs
    console.log('📝 Seeding audit logs...');
    const auditActions = [
      { action: 'user_login', entity: 'user', description: 'User logged in successfully' },
      { action: 'client_created', entity: 'client', description: 'New client profile created' },
      { action: 'dispute_filed', entity: 'dispute', description: 'New dispute filed with bureau' },
      { action: 'payment_processed', entity: 'payment', description: 'Payment processed successfully' },
      { action: 'document_uploaded', entity: 'document', description: 'Document uploaded to client profile' }
    ];
    
    for (let i = 0; i < 20; i++) {
      const action = auditActions[i % auditActions.length];
      const userId = userIds[i % userIds.length];
      const entityId = i + 1;
      
      await client.query(
        `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, action.action, action.entity, entityId, action.description, '127.0.0.1']
      );
    }
    console.log('✅ Created 20 audit log entries');
    
    await client.query('COMMIT');
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('💥 Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🌱 Elite Credit Repair Platform - Database Seeding');
  console.log('=================================================');
  
  try {
    await seedDatabase();
    
    console.log('\n🎯 Seeding Summary:');
    console.log('- 3 sample users created (manager, 2 agents)');
    console.log('- 5 sample clients created');
    console.log('- 5 sample disputes created');
    console.log('- 4 sample payments created');
    console.log('- 4 sample notifications created');
    console.log('- Credit reports for all clients');
    console.log('- 20 audit log entries');
    
    console.log('\n👥 Sample User Accounts:');
    console.log('- manager@creditrepair.com (password: manager123)');
    console.log('- agent1@creditrepair.com (password: agent123)');
    console.log('- agent2@creditrepair.com (password: agent123)');
    
    console.log('\n🚀 Your platform is now ready with sample data!');
    
  } catch (error) {
    console.error('💥 Seeding script failed:', error);
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
  seedDatabase
};