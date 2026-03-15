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
      const products = [
        [
          "R-41103209",
          "Scud (Fujian) Electronics Co., Ltd",
          "NO.98, JIANGBIN EAST AVENUE, MAWEI DISTRICT, FUZHOU, FUJIAN, P.R.CHINA, FUJIAN, 0",
          "China",
          "Sealed Secondary Portable Li-ion Polymer Battery",
          "IS 16046:2015/ IEC 62133 : 2012",
          "01-10-2018",
          "Expired",
          "30-09-2020",
          "click here to view",
          "realme"
        ],
        [
          "R-41103586",
          "Dongguan Yohoo Electronic Technology Co., Ltd.",
          "A Building, NO.12 XINCHENG ROAD, ZHENXING DISTRICT, SHANGSHA COMMUNITY, CHANGAN TOWN, DONGGUAN CITY, P.R. CHINA, DONGGUAN, 518111",
          "China",
          "Power Adapters for IT Equipment",
          "IS 13252(Part 1):2010/ IEC 60950-1 : 2005",
          "05-10-2018",
          "Registered",
          "04-10-2026",
          "click here to view",
          "realme"
        ],
        [
          "R-41103780",
          "Tws Technology (Guangzhou) Limited",
          "1ST, 2ND AND 3RD FLOOR (CAN BE USED AS A FACTORY BUILDING), NO. 39, NANYUNSAN ROAD, SCIENCE CITY OF GUANGZHOU HIGH-TECH INDUSTRIAL DEVELOPMENT ZONE, CHINA, GUANGDONG, 510663",
          "China",
          "Sealed Secondary Portable Li-ion Polymer Battery",
          "IS 16046:2015/ IEC 62133 : 2012",
          "08-10-2018",
          "Expired",
          "07-10-2020",
          "click here to view",
          "realme"
        ],
        [
          "R-41104370",
          "Huizhou Desay Battery Co.,Ltd",
          "No.15 Zone, Zhongkai Hi-Tech Development Zone, Huizhou, GUANGDONG, 516006",
          "China",
          "Sealed Secondary Portable Li-ion Polymer Battery",
          "IS 16046:2015/ IEC 62133 : 2012",
          "11-10-2018",
          "Expired",
          "10-10-2020",
          "click here to view",
          "realme"
        ],
        [
          "R-41104868",
          "Shenzhen Kunxing Technology Co.,Ltd.",
          "ROOM 402,403,4/F & 301,302,303,3/F & 103,1/F, BUILDING 38, XINHEROAD, SHANGMUGU, PINGHU, LONGGANG DISTRICT, SHENZHEN, GUANGDONG, P.R.C 518111",
          "China",
          "SWITCHING POWER SUPPLY (Power Adaptor for IT Equipments)",
          "IS 13252(Part 1):2010/ IEC 60950-1 : 2005",
          "16-10-2018",
          "Expired",
          "15-10-2022",
          "click here to view",
          "realme"
        ],
        [
          "R-41105198",
          "Lite-On Power Technology (Dongguan) Co.,Ltd",
          "NO.299, CHANG AN ZHEN AN WEST ROAD, CHANG AN TOWN, DONGGUAN CITY, GUANGDONG PROVINCE, CHINA 523878",
          "China",
          "Power Adapter for IT Equipment",
          "IS 13252(Part 1):2010/ IEC 60950-1 : 2005",
          "15-10-2018",
          "Registered",
          "14-10-2027",
          "click here to view",
          "realme"
        ],
        [
          "R-41109584",
          "Ten Pao Electronics (Huizhou) Co., Ltd.",
          "DONGJIANG INDUSTRIAL AREA, SHUIKOU TOWN, HUIZHOU CITY, GUANGDONG, 516005",
          "China",
          "Power Adaptor for IT Equipment",
          "IS 13252(Part 1):2010/ IEC 60950-1 : 2005",
          "20-11-2018",
          "Expired",
          "19-11-2020",
          "click here to view",
          "REALME"
        ],
        [
          "R-41120553",
          "Sunwoda Electronic Co. Ltd., Branch 3",
          "BLK. A B C D E, 2 YIHE RD. SHILONG COMMUNITY, SHIYAN STR., BAOAN DISTRICT, SHENZHEN GUANGDONG P.R. CHINA, SHENZHEN, 518108",
          "China",
          "Sealed Secondary Portable Li-ion Polymer Battery",
          "IS 16046:2015/ IEC 62133 : 2012",
          "08-03-2019",
          "Expired",
          "07-03-2021",
          "click here to view",
          "realme"
        ],
        [
          "R-41121932",
          "Ningde Amperex Technology Limited",
          "NO.1 XINGANG ROAD, ZHANGWAN TOWN, JIAOCHENG ZONE, NINGDE CITY, FUJIAN PROVINCE, P.R.CHINA, FUJIAN, 0",
          "China",
          "Sealed Secondary Portable Li-ion Polymer Battery",
          "IS 16046:2015/ IEC 62133 : 2012",
          "22-03-2019",
          "Expired",
          "21-03-2021",
          "click here to view",
          "realme"
        ],
        [
          "R-41134449",
          "Guangdong Oppo Mobile Telecommunications Corp., Ltd.",
          "NO.18 HaiBin Road, Wusha Village, Chang'an Town, DongGuan City, Guangdong Province, P.R. China, GUANGDONG, 523860",
          "China",
          "Power Bank",
          "IS 13252(Part 1):2010/ IEC 60950-1 : 2005",
          "09-08-2019",
          "Expired",
          "08-08-2025",
          "click here to view",
          "realme"
        ],
        [
          "R-83007986",
          "LIGHTANIUM TECHNOLOGIES PRIVATE LIMITED",
          "KHASARA NUMBER 1050, CENTRAL HOPE TOWN AREA, TEHSIL VIKAS NAGAR, SELAQUI INDUSTRIAL AREA, SELAQUI, DEHRADUN, UTTARAKHAND, 248011",
          "India",
          "Self-Ballasted Led Lamps For General Lighting Services",
          "IS 16102 (Part 1) : 2012",
          "03-02-2021",
          "Registered",
          "02-02-2027",
          "click here to view",
          "RR"
        ],
        [
          "R-41013323",
          "Chicony Power Technology(Chongqing) Co., Ltd",
          "NO. 98, JIUJIANG ROAD, SHUANGFU STREET, JIANGJIN DISTRICT, CHONGQING, CHINA, CHONGQING, 402247",
          "China",
          "Power Adaptors for IT Equipments",
          "IS 13252(Part 1):2010/ IEC 60950-1 : 2005",
          "08-04-2015",
          "Registered",
          "07-04-2030",
          "click here to view",
          "hp,HP"
        ]
      ];

      for (const row of products) {
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
