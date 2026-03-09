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

        const [ventasRows] = await db.query(
            `SELECT COALESCE(SUM(precioVenta), 0) as totalVentas 
             FROM ventas WHERE clienteId = ? AND tenant_id = ? AND estado NOT IN ('apartado', 'cancelado')`,
            [id, tenant_id]
        );

        const [abonosRows] = await db.query(
            `SELECT COALESCE(SUM(monto), 0) as totalAbonos 
             FROM abonos WHERE clienteId = ? AND tenant_id = ? AND verificado = 1`,
            [id, tenant_id]
        );

        const totalVentas = Number(ventasRows[0].totalVentas || 0);
        const totalAbonos = Number(abonosRows[0].totalAbonos || 0);
        const nuevaDeuda = Math.max(0, totalVentas - totalAbonos);

        console.log({ totalVentas, totalAbonos, nuevaDeuda });

        await db.query(`UPDATE clientes_app SET deudaTotal = ? WHERE id = ? AND tenant_id = ?`, [nuevaDeuda, id, tenant_id]);

        const [clientes] = await db.query('SELECT deudaTotal FROM clientes_app WHERE id = ?', [id]);
        console.log('Final Client Debt:', clientes[0].deudaTotal);
    } finally {
        await db.end();
    }
}

main().catch(console.error);
