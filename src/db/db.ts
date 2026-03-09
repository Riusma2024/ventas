import Dexie, { type Table } from 'dexie';

export interface Producto {
    id?: number;
    nombre: string;
    costo: number;
    precioSugerido: number;
    foto?: string; // Imagen principal (Base64 o Blob URL)
    stock: number;
    categoria?: string;
    descripcion?: string;
    imagenes?: string[]; // Galería de imágenes
    tenant_id?: string;
}

export interface Venta {
    id?: number;
    productoId: number;
    clienteId: number;
    precioVenta: number;
    utilidad: number;
    fecha: Date;
    pagado: boolean;
    estado?: 'apartado' | 'autorizado' | 'entregado' | 'cancelado';
}

export interface Cliente {
    id?: number;
    nombre: string;
    apodo: string;
    whatsapp?: string;
    facebook?: string;
    otro?: string;
    deudaTotal: number;
    codigo_cliente?: string;
    foto?: string;
    visto?: boolean;
}

export interface Abono {
    id?: number;
    clienteId: number;
    monto: number;
    metodoPago?: string;
    fecha: Date;
    evidencia?: string;
    verificado: boolean;
}

export interface Tanda {
    id?: number;
    nombre: string;
    montoPorNumero: number;
    periodicidad: 'semanal' | 'quincenal' | 'mensual';
    fechaInicio: Date;
    participantes: number; // Siempre 11 según spec para 10 pagos
}

export interface TandaPago {
    id?: number;
    tandaId: number;
    numeroSemana: number;
    participanteNombre: string;
    monto: number;
    pagado: boolean;
    esBeneficiario: boolean;
    evidencia?: string;
}

export class MissVentasDB extends Dexie {
    productos!: Table<Producto>;
    ventas!: Table<Venta>;
    clientes!: Table<Cliente>;
    abonos!: Table<Abono>;
    tandas!: Table<Tanda>;
    tandaPagos!: Table<TandaPago>;

    constructor() {
        super('MissVentasDB');
        this.version(1).stores({
            productos: '++id, nombre, categoria',
            ventas: '++id, productoId, clienteId, fecha, pagado',
            clientes: '++id, nombre, apodo',
            abonos: '++id, clienteId, fecha, verificado',
            tandas: '++id, nombre, fechaInicio',
            tandaPagos: '++id, tandaId, numeroSemana, participanteNombre, esBeneficiario'
        });
    }
}

export const db = new MissVentasDB();
