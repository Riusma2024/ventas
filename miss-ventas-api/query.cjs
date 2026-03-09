const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: 'srv1030.hstgr.io',
        user: 'u394367385_userventas',
        password: '1yUVuJ&+I8n|',
        database: 'u394367385_ventas',
    });

    try {
        const id = 6;
        const tenant_id = 2;
        const foto = "👩"; // Emoji

        console.log("Trying to update foto with emoji...");

        const [result] = await db.query(
            `UPDATE clientes_app SET foto = ? WHERE id = ? AND tenant_id = ?`,
            [foto, id, tenant_id]
        );
        console.log("Success:", result);

    } catch (error) {
        console.error("DB Error:", error.message);
    } finally {
        await db.end();
    }
}

main().catch(console.error);
