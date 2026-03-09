const mysql = require('mysql2/promise');

async function main() {
    console.log('Iniciando actualización de esquema de base de datos...');
    const config = {
        host: 'srv1030.hstgr.io',
        user: 'u394367385_userventas',
        password: '1yUVuJ&+I8n|',
        database: 'u394367385_ventas',
        connectTimeout: 20000 // Aumentar timeout a 20s
    };

    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('Conexión establecida con éxito.');

        // Agregar columna descripcion
        console.log('Verificando columna "descripcion"...');
        const [colsDesc] = await db.query("SHOW COLUMNS FROM productos LIKE 'descripcion'");
        if (colsDesc.length === 0) {
            await db.query('ALTER TABLE productos ADD COLUMN descripcion TEXT NULL');
            console.log('Columna "descripcion" agregada.');
        } else {
            console.log('La columna "descripcion" ya existe.');
        }

        // Agregar columna imagenes (para la galería)
        console.log('Verificando columna "imagenes"...');
        const [colsImg] = await db.query("SHOW COLUMNS FROM productos LIKE 'imagenes'");
        if (colsImg.length === 0) {
            await db.query('ALTER TABLE productos ADD COLUMN imagenes LONGTEXT NULL');
            console.log('Columna "imagenes" agregada.');
        } else {
            console.log('La columna "imagenes" ya existe.');
        }

        console.log('Esquema actualizado correctamente.');
    } catch (err) {
        console.error('Error durante la actualización:', err.message);
        if (err.code === 'ETIMEDOUT') {
            console.error('La conexión excedió el tiempo de espera. Revisa si el servidor permite conexiones remotas.');
        }
    } finally {
        if (db) await db.end();
    }
}

main().catch(console.error);
