const crypto = require("crypto");
const https = require("https");

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, name, total } = req.body;

  // Verify Razorpay signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");
  if (expectedSignature !== razorpay_signature) return res.status(400).json({ error: "Signature mismatch" });

  let emailSent = false;

  // Send email via Brevo
  if (email && process.env.BREVO_API_KEY) {
    const emailData = JSON.stringify({
      sender: { email: "holalittleloop@gmail.com", name: "Little Loop" }, // Change to your verified sender
      to: [{ email: email }],
      subject: "Order Confirmation",
      htmlContent: `<p>Hi ${name || "there"},</p><p>Thank you for your order! Your payment of ₹${total} has been received successfully.</p><p>Warm regards,<br>Little Loop</p>`
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailData),
        'api-key': process.env.BREVO_API_KEY
      }
    };

    const reqBrevo = https.request(options, (resBrevo) => {
      let data = '';
      resBrevo.on('data', (chunk) => data += chunk);
      resBrevo.on('end', () => {
        if (resBrevo.statusCode >= 200 && resBrevo.statusCode < 300) {
          emailSent = true;
        } else {
          console.error("Brevo Error:", resBrevo.statusCode, data);
        }
      });
    });

    reqBrevo.on('error', (error) => {
      console.error("Brevo network error:", error);
    });

    reqBrevo.write(emailData);
    reqBrevo.end();
  }

  res.status(200).json({ success: true, emailSent });
}
