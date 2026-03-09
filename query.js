const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: 'srv1030.hstgr.io',
        user: 'u394367385_userventas',
        password: '1yUVuJ&+I8n|',
        database: 'u394367385_ventas',
    });

    try {
        const [clientes] = await db.query('SELECT * FROM clientes_app WHERE apodo LIKE "%Nora%" OR nombre LIKE "%Nora%" OR codigo_cliente = "C-6"');
        console.log('Clientes:', clientes);

        if (clientes.length === 0) {
            console.log('No client found');
            return;
        }

        const clientId = clientes[0].id;

        const [ventas] = await db.query('SELECT * FROM ventas WHERE clienteId = ?', [clientId]);
        console.log('Ventas:', ventas);

        const [abonos] = await db.query('SELECT * FROM abonos WHERE clienteId = ?', [clientId]);
        console.log('Abonos:', abonos);

        console.log('Calculated VENTA: ', ventas.filter(v => v.estado !== 'apartado' && v.estado !== 'cancelado').reduce((sum, v) => sum + Number(v.precioVenta), 0));
        console.log('Calculated ABONO: ', abonos.filter(a => a.verificado).reduce((sum, a) => sum + Number(a.monto), 0));

    } finally {
        await db.end();
    }
}

main().catch(console.error);
