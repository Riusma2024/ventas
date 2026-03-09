const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: 'srv1030.hstgr.io',
        user: 'u394367385_userventas',
        password: '1yUVuJ&+I8n|',
        database: 'u394367385_ventas',
    });

    try {
        const [clientes] = await db.query('SELECT id, nombre, apodo, deudaTotal, foto, visto FROM clientes_app WHERE tenant_id = 2');
        console.log('Clientes con foto/visto:');
        for (const c of clientes) {
            console.log(`  ID=${c.id} nombre="${c.nombre}" foto="${c.foto}" visto=${c.visto}`);
        }
    } finally {
        await db.end();
    }
}

main().catch(console.error);
