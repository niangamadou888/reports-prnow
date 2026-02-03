const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  console.log(`Connecting to MySQL at ${config.host}:${config.port} as ${config.user}...`);

  // Connect without database first to ensure it exists
  const conn = await mysql.createConnection(config);

  const dbName = process.env.DB_NAME;

  await conn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\``
  );
  console.log(`Database "${dbName}" ready.`);

  await conn.changeUser({ database: dbName });

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS pdf_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      original_name VARCHAR(500) NOT NULL,
      uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      file_size BIGINT NOT NULL DEFAULT 0,
      file_path VARCHAR(1000) NOT NULL,
      file_type ENUM('pdf', 'excel') NOT NULL DEFAULT 'pdf'
    )
  `);
  console.log('Table "pdf_records" ready.');

  const [rows] = await conn.execute('DESCRIBE pdf_records');
  console.log('\nTable structure:');
  console.table(rows);

  await conn.end();
  console.log('\nDone. Database is set up.');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
