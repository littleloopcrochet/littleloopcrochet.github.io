const Razorpay = require("razorpay");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const { amount, currency, receipt } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: currency || "INR",
      receipt: receipt || `order_${Date.now()}`,
    });
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Order creation failed" });
  }
}
