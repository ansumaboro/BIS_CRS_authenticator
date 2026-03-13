import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'bis_authenticator',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDb() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        s_no INT AUTO_INCREMENT PRIMARY KEY,
        registration_number VARCHAR(255) UNIQUE,
        manufacturer_name TEXT,
        manufacturer_address TEXT,
        country VARCHAR(255),
        product_name TEXT,
        is_number VARCHAR(255),
        license_grant_date VARCHAR(255),
        status VARCHAR(255),
        validity VARCHAR(255),
        scope_of_license TEXT,
        brand VARCHAR(255)
      )
    `);

    const [rows] = await connection.query('SELECT count(*) as count FROM products');
    const count = rows[0].count;

    if (count === 0) {
      const seedData = [
        ["R-41000001", "Samsung Electronics", "Seoul, South Korea", "South Korea", "Mobile Phone", "IS 13252 (Part 1)", "2020-01-01", "Operative", "2025-12-31", "Smartphones", "Samsung"],
        ["R-41000002", "Apple Inc.", "Cupertino, CA, USA", "USA", "Tablet Computer", "IS 13252 (Part 1)", "2021-05-15", "Operative", "2026-05-14", "iPads", "Apple"],
        ["R-41000003", "Dell India Pvt Ltd", "Bangalore, India", "India", "Laptop", "IS 13252 (Part 1)", "2019-11-20", "Operative", "2024-11-19", "Laptops", "Dell"],
        ["R-41000004", "Sony Corporation", "Tokyo, Japan", "Japan", "Television", "IS 616", "2022-03-10", "Operative", "2027-03-09", "LED TVs", "Sony"],
        ["R-41000005", "HP India Sales Pvt Ltd", "Gurgaon, India", "India", "Printer", "IS 13252 (Part 1)", "2020-08-25", "Operative", "2025-08-24", "Laser Printers", "HP"]
      ];

      for (const row of seedData) {
        await connection.query(`
          INSERT INTO products (registration_number, manufacturer_name, manufacturer_address, country, product_name, is_number, license_grant_date, status, validity, scope_of_license, brand)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, row);
      }
      console.log('Database seeded successfully');
    }
    connection.release();
  } catch (error) {
    console.error('Error initializing MySQL database:', error);
    console.log('Please ensure MySQL is running and credentials are correct in .env');
  }
}

export default pool;
