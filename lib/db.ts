import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

let initialized = false;

export async function ensureSchema(): Promise<void> {
  if (initialized) return;
  const db = getPool();
  await db.execute(`
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
  initialized = true;
}
