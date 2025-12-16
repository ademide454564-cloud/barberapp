const axios = require('axios');

// Netgsm SMS Gönderme Fonksiyonu
async function sendSMS(phoneNumber, message) {
    const smsEnabled = process.env.SMS_ENABLED === 'true';

    // Test modu - SMS gönderme kapalı
    if (!smsEnabled) {
        console.log('=== SMS GÖNDERİLDİ (TEST MODU) ===');
        console.log('Alıcı:', phoneNumber);
        console.log('Mesaj:', message);
        console.log('===================================');
        return { success: true, message: 'Test mode - SMS not sent' };
    }

    // Gerçek SMS gönderimi
    try {
        const username = process.env.NETGSM_USERNAME;
        const password = process.env.NETGSM_PASSWORD;
        const msgheader = process.env.NETGSM_MSGHEADER || 'KAANHERLI';

        // Telefon numarasını formatla (başında 0 varsa kaldır, +90 ekle)
        let formattedPhone = phoneNumber.replace(/\s/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '90' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('90')) {
            formattedPhone = '90' + formattedPhone;
        }

        // Netgsm API isteği
        const url = 'https://api.netgsm.com.tr/sms/send/get';
        const params = {
            usercode: username,
            password: password,
            gsmno: formattedPhone,
            message: message,
            msgheader: msgheader,
            filter: 0 // Türkçe karakter desteği
        };

        const response = await axios.get(url, { params });

        // Netgsm response kodları:
        // 00: Başarılı
        // 01: Yanlış kullanıcı adı/şifre
        // 02: Kredisi yok
        // vb.

        const responseCode = response.data.trim().split(' ')[0];

        if (responseCode === '00') {
            console.log('=== SMS GÖNDERİLDİ (GERÇEK) ===');
            console.log('Alıcı:', phoneNumber);
            console.log('Mesaj:', message);
            console.log('Response:', response.data);
            console.log('==================================');
            return { success: true, message: 'SMS sent successfully' };
        } else {
            console.error('Netgsm Error:', response.data);
            return { success: false, message: 'SMS sending failed: ' + response.data };
        }
    } catch (error) {
        console.error('SMS Error:', error.message);
        return { success: false, message: 'SMS sending error: ' + error.message };
    }
}

module.exports = { sendSMS };
