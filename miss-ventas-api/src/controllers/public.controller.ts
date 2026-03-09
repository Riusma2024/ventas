import { Request, Response } from 'express';
import { db } from '../config/db';

// [Público] Obtener productos disponibles del catálogo de un Gestionador
export const getPublicCatalog = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenant_id } = req.params;
        const { clienteId, codigo } = req.query;

        if (!tenant_id) {
            res.status(400).json({ error: 'ID de catálogo (tenant) requerido' });
            return;
        }

        // Obtener solo productos con stock > 0
        const [rows] = await db.query<any[]>(
            'SELECT id, nombre, precioSugerido, foto, stock, categoria, descripcion, imagenes FROM productos WHERE tenant_id = ? AND stock > 0',
            [tenant_id]
        );

        // Si se provee clienteId o codigo, obtener su estado actual
        let clienteData = null;
        if (clienteId) {
            const [cRows] = await db.query<any[]>(
                'SELECT id, nombre, whatsapp, deudaTotal, codigo_cliente FROM clientes_app WHERE id = ? AND tenant_id = ?',
                [clienteId, tenant_id]
            );
            if (cRows.length > 0) clienteData = cRows[0];
        } else if (codigo) {
            const [cRows] = await db.query<any[]>(
                'SELECT id, nombre, whatsapp, deudaTotal, codigo_cliente FROM clientes_app WHERE codigo_cliente = ? AND tenant_id = ?',
                [String(codigo).toUpperCase(), tenant_id]
            );
            if (cRows.length > 0) clienteData = cRows[0];
        }

        // Si tenemos un cliente identificado, traer su historial de ventas y abonos
        if (clienteData) {
            // Historial de Ventas (Adquisiciones)
            const [vRows] = await db.query<any[]>(
                `SELECT 
                    v.id, v.precioVenta, v.fecha, v.estado, v.pagado, 
                    p.id as productoId, p.nombre as productoNombre, p.foto as productoFoto, 
                    p.precioSugerido as productoPrecioOriginal, p.stock as productoStock, 
                    p.categoria as productoCategoria, p.descripcion as productoDescripcion, 
                    p.imagenes as productoImagenes
                 FROM ventas v 
                 JOIN productos p ON v.productoId = p.id 
                 WHERE v.clienteId = ? AND v.tenant_id = ?
                 ORDER BY v.fecha DESC`,
                [clienteData.id, tenant_id]
            );

            // Historial de Abonos (Pagos)
            const [aRows] = await db.query<any[]>(
                'SELECT id, monto, metodoPago, fecha, evidencia, verificado FROM abonos WHERE clienteId = ? AND tenant_id = ? ORDER BY fecha DESC',
                [clienteData.id, tenant_id]
            );

            clienteData.ventas = vRows;
            clienteData.abonos = aRows;
        }

        // Obtener nombre del gestionador para personalizar la vista
        const [tenantRows] = await db.query<any[]>(
            'SELECT nombre FROM usuarios WHERE id = ? AND rol = "gestionador"',
            [tenant_id]
        );

        if (tenantRows.length === 0) {
            res.status(404).json({ error: 'Catálogo no encontrado' });
            return;
        }

        res.json({
            negocio: tenantRows[0].nombre,
            productos: rows,
            cliente: clienteData
        });
    } catch (error: any) {
        console.error('Error al obtener catálogo público:', error);
        require('fs').appendFileSync('error_log.txt', new Date().toISOString() + ' ' + error.stack + '\n');

        let errorMsg = 'Error interno del servidor';
        if (error.code === 'ER_CON_COUNT_ERROR') {
            errorMsg = 'El servidor está temporalmente sobrecargado (límite de conexiones). Intenta de nuevo en unos segundos.';
        } else if (error.message) {
            errorMsg = 'Error DB temporal: ' + error.message;
        }

        res.status(500).json({ error: errorMsg });
    }
};

// [Público] Enviar una solicitud de apartado (carrito de compras)
export const submitApartados = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenant_id } = req.params;
        const { cliente, carrito } = req.body;

        if (!tenant_id || !cliente?.nombre || !cliente?.whatsapp || !carrito || carrito.length === 0) {
            res.status(400).json({ error: 'Datos incompletos para crear el apartado' });
            return;
        }

        // 1. Buscar si el cliente ya existe por WhatsApp para este tenant
        let clienteId: number;

        const [existingClient] = await db.query<any[]>(
            'SELECT id FROM clientes_app WHERE tenant_id = ? AND whatsapp = ?',
            [tenant_id, cliente.whatsapp]
        );

        if (existingClient.length > 0) {
            clienteId = existingClient[0].id;
        } else {
            // Crear el cliente si no existe
            const [newClient] = await db.query<any>(
                'INSERT INTO clientes_app (tenant_id, nombre, whatsapp, codigo_cliente) VALUES (?, ?, ?, ?)',
                [tenant_id, cliente.nombre, cliente.whatsapp, 'PENDIENTE']
            );
            clienteId = newClient.insertId;
            const codigo = `C-${clienteId}`;
            await db.query('UPDATE clientes_app SET codigo_cliente = ? WHERE id = ?', [codigo, clienteId]);
        }

        // 2. Procesar cada producto en el carrito
        const apartadosCreados = [];

        for (const item of carrito) {
            const { productoId, cantidad, precioOriginal } = item;

            // Verificamos stock real
            const [prodRes] = await db.query<any[]>(
                'SELECT stock, costo FROM productos WHERE id = ? AND tenant_id = ?',
                [productoId, tenant_id]
            );

            if (prodRes.length === 0 || prodRes[0].stock < cantidad) {
                continue; // Saltar si mágicamente se quedó sin stock en este milisegundo o no existe
            }

            // Un apartado genera tantas entradas de "Venta" como cantidad pida, o se puede agrupar.
            // Según la estructura actual, no hay "cantidad" en Ventas, es un producto = un registro.
            // Para simplificar, insertaremos N registros si cantidad > 1.
            const costoProd = Number(prodRes[0].costo);
            const precioVenta = Number(item.precioVenta || precioOriginal); // Permitir que envíen el precio al que vieron
            const utilidad = precioVenta - costoProd;

            for (let i = 0; i < cantidad; i++) {
                const [insertRes] = await db.query<any>(
                    `INSERT INTO ventas (tenant_id, productoId, clienteId, precioVenta, utilidad, fecha, pagado, estado) 
                     VALUES (?, ?, ?, ?, ?, NOW(), FALSE, 'apartado')`,
                    [tenant_id, productoId, clienteId, precioVenta, utilidad]
                );

                apartadosCreados.push(insertRes.insertId);

                // Nota: El stock NO se descuenta aún. Se descontará cuando el gestionador apruebe el apartado.
            }
        }

        if (apartadosCreados.length === 0) {
            res.status(400).json({ error: 'No se pudo apartar ningún producto (probablemente sin stock)' });
            return;
        }

        res.status(201).json({
            mensaje: 'Solicitud de apartados enviada exitosamente',
            apartadosId: apartadosCreados,
            clienteId
        });

    } catch (error) {
        console.error('Error al enviar solicitud de apartados:', error);
        res.status(500).json({ error: 'Error interno del servidor en la solicitud' });
    }
};
