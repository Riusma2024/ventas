import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || '123456';

let db: mysql.Pool;
try {
    db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 5
    });
} catch(e: any) {
    console.error('DB pool creation failed:', e.message);
}

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

function getToken(req: any) {
    try {
        const h = req.headers['authorization'] || '';
        const t = h.split(' ')[1];
        if (!t) return null;
        return jwt.decode(t, JWT_SECRET);
    } catch { return null; }
}

// HEALTH
app.get('/api/health', (_req: any, res: any) => res.json({ status: 'ok', env: { host: !!process.env.DB_HOST, db: !!process.env.DB_NAME }, time: new Date().toISOString() }));

// LOGIN
app.post('/api/auth/login', async (req: any, res: any) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'Faltan campos' });
        const [rows]: any = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
        const u = rows[0];
        if (!await bcrypt.compare(password, u.password_hash)) return res.status(401).json({ error: 'Credenciales inválidas' });
        const token = jwt.encode({ id: u.id, rol: u.rol, tenant_id: u.tenant_id, exp: Math.floor(Date.now()/1000) + 2592000 }, JWT_SECRET);
        res.json({ token, usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, tenant_id: u.tenant_id } });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// ME
app.get('/api/auth/me', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const [rows]: any = await db.query('SELECT id,nombre,email,rol,tenant_id,sub_status,sub_expira_el FROM usuarios WHERE id=?', [p.id]);
        if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
        res.json(rows[0]);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// REGISTER
app.post('/api/auth/registro', async (req: any, res: any) => {
    try {
        const { nombre, email, password } = req.body || {};
        if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos' });
        const hash = await bcrypt.hash(password, 10);
        const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const [r]: any = await db.query("INSERT INTO usuarios (nombre,email,password_hash,rol,tenant_id,sub_status) VALUES(?,?,?,'vendedor',?,'trial')", [nombre, email, hash, tenantId]);
        const token = jwt.encode({ id: r.insertId, rol: 'vendedor', tenant_id: tenantId, exp: Math.floor(Date.now()/1000) + 2592000 }, JWT_SECRET);
        res.status(201).json({ token, usuario: { id: r.insertId, nombre, email, rol: 'vendedor', tenant_id: tenantId } });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// GESTIONADORES LIST
app.get('/api/users/gestionadores', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const [rows] = await db.query("SELECT id,nombre,email,creado_en,sub_status,sub_expira_el FROM usuarios WHERE rol IN ('vendedor','gestionador') ORDER BY creado_en DESC");
        res.json(rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// CREATE USER
app.post('/api/users', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const { nombre, email, password } = req.body || {};
        if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos' });
        const hash = await bcrypt.hash(password, 10);
        const tenantId = `tenant_${Date.now()}`;
        const [r]: any = await db.query("INSERT INTO usuarios (nombre,email,password_hash,rol,tenant_id,sub_status) VALUES(?,?,?,'vendedor',?,'trial')", [nombre, email, hash, tenantId]);
        res.status(201).json({ id: r.insertId, message: 'Vendedor creado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// UPDATE USER
app.put('/api/users/gestionadores/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const { nombre, email } = req.body || {};
        await db.query('UPDATE usuarios SET nombre=?,email=? WHERE id=?', [nombre, email, req.params.id]);
        res.json({ message: 'Actualizado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE USER
app.delete('/api/users/gestionadores/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        await db.query("DELETE FROM usuarios WHERE id=? AND rol!='superadmin'", [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// CUPONES
app.get('/api/admin/cupones', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try { const [rows] = await db.query('SELECT * FROM cupones ORDER BY creado_en DESC'); res.json(rows); }
    catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/cupones', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const { codigo, dias_regalo, limite_usos } = req.body || {};
        if (!codigo || !dias_regalo) return res.status(400).json({ error: 'Faltan campos' });
        const [r]: any = await db.query('INSERT INTO cupones (codigo,dias_regalo,limite_usos,usos_actuales,activo) VALUES(?,?,?,0,1)', [codigo.toUpperCase(), dias_regalo, limite_usos||100]);
        res.status(201).json({ id: r.insertId, message: 'Cupón creado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/cupones/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try { await db.query('DELETE FROM cupones WHERE id=?', [req.params.id]); res.json({ message: 'Eliminado' }); }
    catch(e: any) { res.status(500).json({ error: e.message }); }
});

export default app;
