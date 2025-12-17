const router = require('express').Router();
let Verification = require('../models/verification.model');
let Customer = require('../models/customer.model');

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.route('/send').post(async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json('Phone number is required');
  }

  try {
    // DEV MODE: Sabit kod kullan (NetGSM bağlanana kadar)
    const code = '123456';
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await Verification.deleteMany({ phone_number });

    const newVerification = new Verification({
      phone_number,
      code,
      expires_at,
    });

    await newVerification.save();

    console.log(`Verification code for ${phone_number}: ${code}`);

    res.json({
      message: 'Verification code sent!',
      code: code
    });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

router.route('/verify').post(async (req, res) => {
  const { phone_number, code } = req.body;

  if (!phone_number || !code) {
    return res.status(400).json('Phone number and code are required');
  }

  try {
    const verification = await Verification.findOne({
      phone_number,
      code,
      verified: false,
      expires_at: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(400).json('Invalid or expired code');
    }

    verification.verified = true;
    await verification.save();

    const customer = await Customer.findOne({ phone_number });

    res.json({
      message: 'Phone verified successfully',
      customer: customer || null,
    });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

router.route('/check-customer/:phone').get(async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone_number: req.params.phone });
    res.json({ exists: !!customer, customer });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;
