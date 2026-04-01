import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'miss_ventas_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para inicializar tablas críticas si no existen
export const initDB = async () => {
    try {
        console.log('Initializing Database Structure...');
        
        // Tabla de Abonos (Payments)
        await db.query(`
            CREATE TABLE IF NOT EXISTS abonos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(255) NOT NULL,
                clienteId INT NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                metodoPago VARCHAR(50) DEFAULT 'Efectivo',
                evidencia TEXT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                verificado BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Database Schema verified.');
    } catch (error) {
        console.error('❌ Error initializing database schema:', error);
    }
};
