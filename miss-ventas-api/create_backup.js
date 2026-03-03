const mysqldump = require('mysqldump');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Generar nombre de archivo con la fecha
const dateStr = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
const backupFilename = `respaldo_miss_ventas_db_${dateStr}.sql`;
const outputPath = path.join(__dirname, '..', backupFilename);

console.log('Iniciando el respaldo de la base de datos...');

mysqldump({
    connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'miss_ventas_db',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
    },
    dumpToFile: outputPath,
})
    .then(() => {
        console.log(`✅ Backup creado con éxito!`);
        console.log(`📂 Archivo guardado en: ${outputPath}`);
    })
    .catch((err) => {
        console.error('❌ Error al crear el backup:', err);
    });
