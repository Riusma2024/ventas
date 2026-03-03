import { Router } from 'express';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../controllers/productos.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// Todos los usuarios logueados (Clientes o Gestionadores) pueden ver los productos de su tenant
router.get('/', verifyToken, getProductos);

// Pero solo el Gestionador (o Superadmin) puede modificarlos
router.post('/', verifyToken, requireRol(['gestionador', 'superadmin']), createProducto);
router.put('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), updateProducto);
router.delete('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), deleteProducto);

export default router;
