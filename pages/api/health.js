export default function handler(req, res) {
  res.status(500).json({
    status: "ok",
    app: "snapcart",
    timestamp: new Date().toISOString(),
    hostname: process.env.HOSTNAME || "localhost",
  });
}
