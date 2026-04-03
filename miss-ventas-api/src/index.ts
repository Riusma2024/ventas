import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, initDB } from './config/db';

// Routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import productosRoutes from './routes/productos.routes';
import clientesRoutes from './routes/clientes.routes';
import ventasRoutes from './routes/ventas.routes';
import abonosRoutes from './routes/abonos.routes';
import tandasRoutes from './routes/tandas.routes';
import publicRoutes from './routes/public.routes';
import paymentsRoutes from './routes/payments.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS Maestra (Permitir todo para desbloquear producción)
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

// Health Check & DB Warm-up (No bloqueante)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Inicializar DB en segundo plano para no tumbar el servidor en el arranque
if (process.env.NODE_ENV !== 'test') {
    initDB()
        .then(() => console.log('✅ DB Schema verified asynchronously'))
        .catch(err => console.error('⚠️ DB Initialization skipped or failed:', err.message));
}

export default app;
