import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || '123456';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 5
});

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
app.get('/api/health', (_req: any, res: any) => res.json({ status: 'ok', db: !!process.env.DB_HOST, time: new Date().toISOString() }));

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

// FORGOT PASSWORD
app.post('/api/auth/forgot-password', async (req: any, res: any) => {
    // Simplificado: acepta email y retorna OK
    res.json({ message: 'Si el email existe, recibirás instrucciones' });
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
        const { nombre, email, password, cupon } = req.body || {};
        if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos' });
        
        // Check cupon si existe
        let diasExtra = 0;
        if (cupon) {
            const [cups]: any = await db.query("SELECT * FROM cupones WHERE codigo=? AND activo=1 AND (limite_usos IS NULL OR usos_actuales < limite_usos)", [cupon.toUpperCase()]);
            if (cups.length > 0) {
                diasExtra = cups[0].dias_regalo;
                await db.query("UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id=?", [cups[0].id]);
            }
        }
        
        const hash = await bcrypt.hash(password, 10);
        const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        let subExpira = null;
        if (diasExtra > 0) {
            const d = new Date(); d.setDate(d.getDate() + diasExtra);
            subExpira = d;
        } else {
            // 3 días de gracia
            const d = new Date(); d.setDate(d.getDate() + 3);
            subExpira = d;
        }
        
        const [r]: any = await db.query(
            "INSERT INTO usuarios (nombre,email,password_hash,rol,tenant_id,sub_status,sub_expira_el) VALUES(?,?,?,'vendedor',?,'trial',?)",
            [nombre, email, hash, tenantId, subExpira]
        );
        const token = jwt.encode({ id: r.insertId, rol: 'vendedor', tenant_id: tenantId, exp: Math.floor(Date.now()/1000) + 2592000 }, JWT_SECRET);
        res.status(201).json({ token, usuario: { id: r.insertId, nombre, email, rol: 'vendedor', tenant_id: tenantId } });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// GESTIONADORES LIST (admin)
app.get('/api/users/gestionadores', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const [rows] = await db.query("SELECT id,nombre,email,creado_en,sub_status,sub_expira_el FROM usuarios WHERE rol IN ('vendedor','gestionador') ORDER BY creado_en DESC");
        res.json(rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const { nombre, email, password } = req.body || {};
        if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos' });
        const hash = await bcrypt.hash(password, 10);
        const tenantId = `tenant_${Date.now()}`;
        const d = new Date(); d.setDate(d.getDate() + 30);
        const [r]: any = await db.query("INSERT INTO usuarios (nombre,email,password_hash,rol,tenant_id,sub_status,sub_expira_el) VALUES(?,?,?,'vendedor',?,'activo',?)", [nombre, email, hash, tenantId, d]);
        res.status(201).json({ id: r.insertId, message: 'Vendedor creado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/gestionadores/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p || p.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    try {
        const { nombre, email } = req.body || {};
        await db.query('UPDATE usuarios SET nombre=?,email=? WHERE id=?', [nombre, email, req.params.id]);
        res.json({ message: 'Actualizado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

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

// PRODUCTOS (por tenant)
app.get('/api/productos', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const [rows] = await db.query('SELECT id, nombre, descripcion, precioSugerido, stock, foto, imagenes, categoria, tenant_id, creado_en FROM productos WHERE tenant_id=? ORDER BY creado_en DESC', [p.tenant_id]);
        res.json(rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/productos', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { nombre, precio, descripcion, imagen_url, categoria } = req.body || {};
        const [r]: any = await db.query('INSERT INTO productos (nombre,precio,descripcion,imagen_url,categoria,tenant_id) VALUES(?,?,?,?,?,?)', [nombre, precio, descripcion||null, imagen_url||null, categoria||null, p.tenant_id]);
        res.status(201).json({ id: r.insertId });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/productos/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { nombre, precio, descripcion, imagen_url, categoria } = req.body || {};
        await db.query('UPDATE productos SET nombre=?,precio=?,descripcion=?,imagen_url=?,categoria=? WHERE id=? AND tenant_id=?', [nombre, precio, descripcion||null, imagen_url||null, categoria||null, req.params.id, p.tenant_id]);
        res.json({ message: 'Actualizado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/productos/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try { await db.query('DELETE FROM productos WHERE id=? AND tenant_id=?', [req.params.id, p.tenant_id]); res.json({ message: 'Eliminado' }); }
    catch(e: any) { res.status(500).json({ error: e.message }); }
});

// CLIENTES
app.get('/api/clientes', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const [rows] = await db.query('SELECT id, nombre, apodo, telefono, whatsapp, direccion, deudaTotal, visto, codigo_cliente, tenant_id, creado_en FROM clientes WHERE tenant_id=? ORDER BY creado_en DESC', [p.tenant_id]);
        res.json(rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clientes', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { nombre, apodo, telefono, direccion } = req.body || {};
        const [r]: any = await db.query('INSERT INTO clientes (nombre,apodo,telefono,direccion,tenant_id) VALUES(?,?,?,?,?)', [nombre, apodo||null, telefono||null, direccion||null, p.tenant_id]);
        res.status(201).json({ id: r.insertId });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clientes/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { nombre, apodo, telefono, direccion } = req.body || {};
        await db.query('UPDATE clientes SET nombre=?,apodo=?,telefono=?,direccion=? WHERE id=? AND tenant_id=?', [nombre, apodo||null, telefono||null, direccion||null, req.params.id, p.tenant_id]);
        res.json({ message: 'Actualizado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clientes/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try { await db.query('DELETE FROM clientes WHERE id=? AND tenant_id=?', [req.params.id, p.tenant_id]); res.json({ message: 'Eliminado' }); }
    catch(e: any) { res.status(500).json({ error: e.message }); }
});

// VENTAS
app.get('/api/ventas', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const [rows]: any = await db.query(`
            SELECT v.id, v.clienteId, v.productoId, v.total, v.precioVenta, v.utilidad, v.notas, v.estado, v.fecha, v.creado_en, 
                   c.nombre as cliente_nombre, c.apodo as cliente_apodo 
            FROM ventas v 
            LEFT JOIN clientes c ON v.clienteId=c.id 
            WHERE v.tenant_id=? 
            ORDER BY v.creado_en DESC
        `, [p.tenant_id]);
        
        // ASEGURAR QUE LOS IDs SEAN CONSISTENTES PARA EL FRONTEND
        const mapped = rows.map((r: any) => ({
            ...r,
            id: Number(r.id),
            clienteId: Number(r.clienteId),
            productoId: Number(r.productoId)
        }));
        res.json(mapped);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ventas/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const [rows]: any = await db.query(`
            SELECT v.*, c.nombre as cliente_nombre, c.apodo as cliente_apodo, pr.nombre as producto_nombre
            FROM ventas v 
            LEFT JOIN clientes c ON v.clienteId=c.id 
            LEFT JOIN productos pr ON v.productoId=pr.id
            WHERE v.id=? AND v.tenant_id=?
        `, [req.params.id, p.tenant_id]);
        if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
        res.json(rows[0]);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ventas', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { cliente_id, total, productos, notas } = req.body || {};
        const [r]: any = await db.query('INSERT INTO ventas (cliente_id,total,notas,tenant_id) VALUES(?,?,?,?)', [cliente_id||null, total, notas||null, p.tenant_id]);
        res.status(201).json({ id: r.insertId });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// ABONOS
app.get('/api/abonos', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { clienteId } = req.query;
        let query = 'SELECT *, clienteId as clienteId, evidencia as evidencia FROM abonos WHERE tenant_id=?';
        const params: any[] = [p.tenant_id];
        
        if (clienteId) {
            query += ' AND clienteId = ?';
            params.push(clienteId);
        }
        
        query += ' ORDER BY fecha DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/abonos', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { clienteId, monto, metodoPago, evidenca, verificado, notas, fecha } = req.body || {};
        const [r]: any = await db.query(
            'INSERT INTO abonos (clienteId, monto, metodoPago, evidencia, verificado, notas, fecha, tenant_id) VALUES (?,?,?,?,?,?,?,?)', 
            [clienteId, monto, metodoPago||'Efectivo', evidenca||null, verificado||0, notas||null, fecha||new Date(), p.tenant_id]
        );
        res.status(201).json({ id: r.insertId });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/abonos/:id', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const { verificado } = req.body || {};
        await db.query('UPDATE abonos SET verificado=? WHERE id=? AND tenant_id=?', [verificado, req.params.id, p.tenant_id]);
        res.json({ message: 'Actualizado' });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// PUBLIC catalog
app.get('/api/public/catalogo/:slug', async (req: any, res: any) => {
    try {
        const [users]: any = await db.query('SELECT id,nombre,tenant_id FROM usuarios WHERE negocio_slug=?', [req.params.slug]);
        if (!users.length) return res.status(404).json({ error: 'Catálogo no encontrado' });
        const [productos] = await db.query('SELECT * FROM productos WHERE tenant_id=?', [users[0].tenant_id]);
        res.json({ negocio: users[0].nombre, productos });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// TANDAS
app.get('/api/tandas', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const [rows] = await db.query('SELECT * FROM tandas WHERE tenant_id=? ORDER BY creado_en DESC', [p.tenant_id]);
        res.json(rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// PAYMENTS
app.get('/api/payments', async (req: any, res: any) => {
    const p = getToken(req); if (!p) return res.status(401).json({ error: 'No autorizado' });
    try {
        const [rows] = await db.query('SELECT * FROM payments WHERE tenant_id=? ORDER BY creado_en DESC', [p.tenant_id]);
        res.json(rows);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
});

// Catch-all 404
app.use('*', (req: any, res: any) => {
    res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
});

export default app;
