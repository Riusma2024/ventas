const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: 'srv1030.hstgr.io',
        user: 'u394367385_userventas',
        password: '1yUVuJ&+I8n|',
        database: 'u394367385_ventas',
    });

    try {
        console.log('Adding "descripcion" column to "productos" table...');
        await connection.query('ALTER TABLE productos ADD COLUMN descripcion TEXT AFTER categoria');
        console.log('Column "descripcion" added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column "descripcion" already exists.');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        await connection.end();
    }
}

main().catch(console.error);
