const axios = require('axios');
const jwt = require('jwt-simple');
require('dotenv').config();

const t = jwt.encode({
    id: 1, // Doesn't matter
    rol: 'gestionador',
    tenant_id: 2,
    exp: Math.floor(Date.now() / 1000) + 3600
}, process.env.JWT_SECRET || 'fallback_secret');

async function run() {
    try {
        const req = await axios.put('http://localhost:3000/api/ventas/2/estado', { estado: 'cancelado' }, { headers: { Authorization: 'Bearer ' + t } });
        console.log("SUCCESS:", req.data);
    } catch (e) {
        console.log("ERROR RECEIVED:", e.response?.data || e.message);
    }
}
run();
