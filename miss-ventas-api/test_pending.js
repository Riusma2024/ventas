const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPending() {
    const c = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    // Find one pending sale
    const [rows] = await c.query("SELECT * FROM ventas WHERE estado = 'apartado' LIMIT 1");
    if (rows.length === 0) {
        console.log("No hay ventas en estado apartado");
        c.end();
        return;
    }

    const ventaId = rows[0].id;
    const tenantId = rows[0].tenant_id;
    console.log(`Testing reject for sale ${ventaId} tenant ${tenantId}...`);

    try {
        const [result] = await c.query(
            "UPDATE ventas SET estado = 'cancelado' WHERE id = ? AND tenant_id = ?",
            [ventaId, tenantId]
        );
        console.log("Update success:", result);
    } catch (e) {
        console.error("DB Error:", e);
    }

    c.end();
}
checkPending().catch(console.error);
