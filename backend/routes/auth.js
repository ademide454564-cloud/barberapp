const router = require('express').Router();
const Customer = require('../models/customer.model');
const Verification = require('../models/verification.model');
const bcrypt = require('bcryptjs');

// Helper to generate 6 digit code
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { phone_number, password } = req.body;

        if (!phone_number || !password) {
            return res.status(400).json({ message: 'Telefon numarası ve şifre gereklidir.' });
        }

        const customer = await Customer.findOne({ phone_number });

        if (!customer) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Şifre kontrolü: bcrypt hash veya plain text desteği
        let isPasswordValid = false;

        // Eğer şifre hash ile başlıyorsa bcrypt kullan
        if (customer.password.startsWith('$2b$') || customer.password.startsWith('$2a$')) {
            isPasswordValid = await bcrypt.compare(password, customer.password);
        } else {
            // Plain text şifre karşılaştırması
            isPasswordValid = customer.password === password;
        }

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Hatalı şifre.' });
        }

        res.json({
            message: 'Giriş başarılı',
            customer: customer
        });

    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası: ' + err.message });
    }
});

// POST /auth/send-sms
router.post('/send-sms', async (req, res) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) return res.status(400).json({ message: 'Telefon numarası gereklidir.' });

        // DEV MODE: Sabit kod kullan (NetGSM bağlanana kadar)
        const code = '123456';
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 dk

        // Mevcut kodları sil
        await Verification.deleteMany({ phone_number });

        // Yeni kod oluştur
        const newVerification = new Verification({
            phone_number,
            code,
            expires_at
        });
        await newVerification.save();

        console.log(`[SMS MOCK] ${phone_number} için kod: ${code}`);

        res.json({
            message: 'Doğrulama kodu gönderildi',
            code: code // Test amaçlı kodu dönüyoruz
        });

    } catch (err) {
        res.status(500).json({ message: 'Hata: ' + err.message });
    }
});

// POST /auth/verify-and-register
router.post('/verify-and-register', async (req, res) => {
    try {
        const { phone_number, code, name, email, password } = req.body;

        if (!phone_number || !code || !name || !password) {
            return res.status(400).json({ message: 'Eksik bilgi.' });
        }

        // Kodu doğrula
        const verification = await Verification.findOne({
            phone_number,
            code,
            expires_at: { $gt: new Date() }
        });

        if (!verification) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş kod.' });
        }

        // Kullanıcı zaten var mı?
        let customer = await Customer.findOne({ phone_number });
        if (customer) {
            return res.status(400).json({ message: 'Bu telefon numarası zaten kayıtlı.' });
        }

        // Yeni kullanıcı oluştur
        const isAdmin = phone_number === '5541483634';

        customer = new Customer({
            name,
            phone_number,
            email,
            password,
            is_admin: isAdmin
        });

        await customer.save();

        // Doğrulamayı sil/işaretle
        await Verification.deleteMany({ phone_number });

        res.json({
            message: 'Kayıt başarılı',
            customer: customer
        });

    } catch (err) {
        res.status(500).json({ message: 'Hata: ' + err.message });
    }
});

module.exports = router;
