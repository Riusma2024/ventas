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

dotenv.config();

// Inicializar DB (Crea tablas faltantes en Vercel)
initDB().catch(err => console.error('Error in DB Init:', err));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes Setup
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/abonos', abonosRoutes);
app.use('/api/tandas', tandasRoutes);
app.use('/api/public', publicRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Miss Ventas API is running' });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);

        // Check DB Connection
        db.query('SELECT 1')
            .then(() => console.log('✅ Connected to MySQL Database (miss_ventas_db)'))
            .catch((err) => console.error('❌ Database connection failed:', err.message));
    });
}

export default app;
