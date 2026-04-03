import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || '123456';

// Configuración de base de datos integrada
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 5
});

app.use(cors({ 
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());

// --- ENDPOINTS INTEGRADOS PARA EMERGENCIA NO MODULARES ---

// 1. Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', type: 'monolith_rescue', time: new Date().toISOString() });
});

// 2. Login de Emergencia (Directamente de la DB)
app.post('/api/auth/login', async (req: any, res: any) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Faltan campos' });
        
        const [rows]: any = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const usuario = rows[0];
        const isMatch = await bcrypt.compare(password, usuario.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const payload = { 
            id: usuario.id, 
            rol: usuario.rol, 
            tenant_id: usuario.tenant_id, 
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) 
        };
        const token = jwt.encode(payload, JWT_SECRET);
        
        res.json({ 
            token, 
            usuario: { 
                id: usuario.id, 
                nombre: usuario.nombre, 
                email: usuario.email, 
                rol: usuario.rol, 
                tenant_id: usuario.tenant_id 
            } 
        });
    } catch (e: any) {
        console.error('Monolith Crash:', e.message);
        res.status(500).json({ error: 'Fatal Monolith Error', details: e.message });
    }
});

// Nota: El resto de las rutas se podrán restaurar una vez que el acceso base sea exitoso.

export default app;
