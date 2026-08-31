const https = require('https');

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { amount, currency, receipt } = req.body;

  const postData = JSON.stringify({
    amount: amount * 100,
    currency: currency || "INR",
    receipt: receipt || `order_${Date.now()}`
  });

  const options = {
    hostname: 'api.razorpay.com',
    port: 443,
    path: '/v1/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': 'Basic ' + Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64')
    }
  };

  const reqRazor = https.request(options, (resRazor) => {
    let data = '';
    resRazor.on('data', (chunk) => data += chunk);
    resRazor.on('end', () => {
      res.status(resRazor.statusCode).json(JSON.parse(data));
    });
  });

  reqRazor.on('error', (error) => {
    console.error(error);
    res.status(500).json({ error: 'Order creation failed' });
  });

  reqRazor.write(postData);
  reqRazor.end();
}
