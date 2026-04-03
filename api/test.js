export default function handler(req, res) {
  res.status(200).json({ status: 'alive', serverTime: new Date().toISOString() });
}
