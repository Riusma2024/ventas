import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, initDB } from './config/db.js';

// Routes con extensión .js (Necesario para ESM/Vercel)
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import productosRoutes from './routes/productos.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import abonosRoutes from './routes/abonos.routes.js';
import tandasRoutes from './routes/tandas.routes.js';
import publicRoutes from './routes/public.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();

// Configuración de CORS Maestra
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Inyectar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/abonos', abonosRoutes);
app.use('/api/tandas', tandasRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);

// Health Check & DB Warm-up
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Catch-all 404 for debugging
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Express CatchAll 404', originalUrl: req.originalUrl, url: req.url, path: req.path });
});

// Inicializar DB en segundo plano
if (process.env.NODE_ENV !== 'test') {
    initDB()
        .then(() => console.log('✅ DB Schema verified'))
        .catch(err => console.error('⚠️ DB Error:', err.message));
}

export default app;
