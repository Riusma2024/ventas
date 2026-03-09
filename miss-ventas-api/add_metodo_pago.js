const mysql = require('mysql2/promise');

async function main() {
    const config = {
        host: 'srv1030.hstgr.io',
        user: 'u394367385_userventas',
        password: '1yUVuJ&+I8n|',
        database: 'u394367385_ventas',
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Adding metodoPago column to abonos table...');

        // Check if column exists first or just try to add it
        await connection.query('ALTER TABLE abonos ADD COLUMN metodoPago VARCHAR(50) DEFAULT "Efectivo" AFTER monto');

        console.log('Column added successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
