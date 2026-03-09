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
        console.log('Ensuring all abonos have a metodoPago value...');

        // Update any null or empty metodoPago to 'Efectivo'
        const [result] = await connection.query('UPDATE abonos SET metodoPago = "Efectivo" WHERE metodoPago IS NULL OR metodoPago = ""');

        console.log(`Updated ${result.affectedRows} rows.`);
        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
