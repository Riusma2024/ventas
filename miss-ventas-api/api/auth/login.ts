import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import pkg from 'jwt-simple';
import dotenv from 'dotenv';

dotenv.config();
const { encode } = pkg;
const JWT_SECRET = process.env.JWT_SECRET || '123456';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 1
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

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
        
        const token = encode(payload, JWT_SECRET);
        
        res.status(200).json({ 
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
        res.status(500).json({ error: 'Atomic Login failure', details: e.message });
    }
}
