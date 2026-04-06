export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    app: "snapcart",
    timestamp: new Date().toISOString(),
    hostname: process.env.HOSTNAME || "localhost",
  });
}
