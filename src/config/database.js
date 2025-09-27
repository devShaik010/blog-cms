const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: false, // Disable SSL for local development
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

// Initialize database tables
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Create articles table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_name);
      CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
    `;
    
    await client.query(createTableQuery);
    console.log('Articles table created/verified successfully');
    
    client.release();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Database query helper
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get database client
async function getClient() {
  return await pool.connect();
}

// Close database connection
async function closePool() {
  await pool.end();
}

module.exports = {
  query,
  getClient,
  initDatabase,
  closePool,
  pool
};