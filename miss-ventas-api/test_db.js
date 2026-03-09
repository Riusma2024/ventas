require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('Testing connection to the database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
        });
        console.log('✅ Successfully connected to the remote database!');
        await connection.end();
    } catch (err) {
        console.error('❌ Connection failed:');
        console.error(err.message);
    }
}

testConnection();
