const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'wiki', 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Verifying database contents...');
console.log('Database path:', dbPath);

// Check laws_regulations table
db.all('SELECT name, category, jurisdiction_level FROM laws_regulations', (err, rows) => {
  if (err) {
    console.error('Error querying laws_regulations:', err);
  } else {
    console.log('\n=== LAWS IN DATABASE ===');
    if (rows.length === 0) {
      console.log('No laws found in database');
    } else {
      rows.forEach(row => {
        console.log(`- ${row.name} (${row.category}, ${row.jurisdiction_level})`);
      });
    }
  }
  
  // Check credit_industry_entities table
  db.all('SELECT legal_name, category FROM credit_industry_entities', (err, rows) => {
    if (err) {
      console.error('Error querying credit_industry_entities:', err);
    } else {
      console.log('\n=== CREDIT INDUSTRY ENTITIES ===');
      if (rows.length === 0) {
        console.log('No entities found in database');
      } else {
        rows.forEach(row => {
          console.log(`- ${row.legal_name} (${row.category})`);
        });
      }
    }
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('\nDatabase verification completed.');
      }
    });
  });
});