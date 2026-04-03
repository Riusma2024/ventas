import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';
import { db } from '../config/db';
import { ResultSetHeader } from 'mysql2';
import { Resend } from 'resend';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const resend = new Resend(process.env.RESEND_API_KEY);

const generateSlug = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim().replace(/^-+|-+$/g, '');
};

export const loginUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) { res.status(400).json({ error: 'Email y contraseña son requeridos' }); return; }
        const [rows] = await db.query<any[]>('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) { res.status(401).json({ error: 'Credenciales inválidas' }); return; }
        const usuario = rows[0];
        const isMatch = await bcrypt.compare(password, usuario.password_hash);
        if (!isMatch) { res.status(401).json({ error: 'Credenciales inválidas' }); return; }
        const payload = { id: usuario.id, rol: usuario.rol, tenant_id: usuario.tenant_id, exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) };
        const token = jwt.encode(payload, JWT_SECRET);
        res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, tenant_id: usuario.tenant_id, negocio_slug: usuario.negocio_slug } });
    } catch (error) { res.status(500).json({ error: 'Error interno del servidor' }); }
};

export const registrarVendedor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, email, password, negocio_nombre, codigo_cupon } = req.body;
        if (!nombre || !email || !password || !negocio_nombre) { res.status(400).json({ error: 'Faltan campos' }); return; }
        const [existing] = await db.query<any[]>('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) { res.status(400).json({ error: 'Email ya registrado' }); return; }
        let slug = generateSlug(negocio_nombre);
        const [existingSlug] = await db.query<any[]>('SELECT id FROM usuarios WHERE negocio_slug = ?', [slug]);
        if (existingSlug.length > 0) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        let diasPrueba = 3;
        if (codigo_cupon) {
            const [cupon] = await db.query<any[]>('SELECT * FROM cupones WHERE codigo = ? AND activo = 1 AND usos_actuales < limite_usos', [codigo_cupon]);
            if (cupon.length > 0) { diasPrueba = cupon[0].dias_regalo; await db.query('UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = ?', [cupon[0].id]); }
        }
        const fechaExpira = new Date(); fechaExpira.setDate(fechaExpira.getDate() + diasPrueba);
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query<ResultSetHeader>('INSERT INTO usuarios (nombre, email, password_hash, rol, negocio_nombre, negocio_slug, sub_expira_el, sub_status) VALUES (?, ?, ?, "vendedor", ?, ?, ?, "trial")', [nombre, email, hash, negocio_nombre, slug, fechaExpira]);
        const newId = result.insertId; await db.query('UPDATE usuarios SET tenant_id = ? WHERE id = ?', [newId, newId]);
        if (process.env.RESEND_API_KEY) { await resend.emails.send({ from: 'Miss Ventas <onboarding@resend.dev>', to: email, subject: 'Bienvenido', html: `<p>Listo en: miss-ventas.com/catalogo/${slug}</p>` }); }
        res.status(201).json({ message: 'Éxito', slug });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const solicitarRecuperacion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expira = new Date(Date.now() + 3600000);
        const [user]: any = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (user.length === 0) { res.status(404).json({ error: 'Email no encontrado' }); return; }
        await db.query('UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expira, email]);
        if (process.env.RESEND_API_KEY) { await resend.emails.send({ from: 'Miss Ventas <seguridad@resend.dev>', to: email, subject: 'Recuperar', html: `<p>Código: ${token}</p>` }); }
        res.json({ message: 'Enviado' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const restablecerPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, token, newPassword } = req.body;
        const [user]: any = await db.query('SELECT id FROM usuarios WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()', [email, token]);
        if (user.length === 0) { res.status(400).json({ error: 'Invalido' }); return; }
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [hash, email]);
        res.json({ message: 'Actualizada' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
