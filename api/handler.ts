import { VercelRequest, VercelResponse } from '@vercel/node';

// Re-export como proxy handler hacia el backend API principal
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Proxy de emergencia hacia el backend API
    const BACKEND = 'https://ventas-murex.vercel.app';
    const targetPath = req.url || '/';
    const targetUrl = `${BACKEND}${targetPath}`;

    try {
        const fetchRes = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers['authorization'] ? { 'Authorization': req.headers['authorization'] as string } : {}),
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
        });

        const data = await fetchRes.json();
        res.status(fetchRes.status).json(data);
    } catch (e: any) {
        res.status(500).json({ error: 'Proxy error', message: e.message, target: targetUrl });
    }
}
