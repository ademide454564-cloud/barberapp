const fetch = require('node-fetch');

async function testAuth() {
    console.log('Testing Auth Flow...');
    const baseUrl = 'http://localhost:5000/auth';
    const testPhone = '5541483634';

    try {
        // 1. Send SMS
        console.log('1. Sending SMS...');
        const smsRes = await fetch(`${baseUrl}/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: testPhone })
        });
        const smsData = await smsRes.json();
        console.log('SMS Response:', smsData);

        if (!smsData.code) throw new Error('No code received');

        // 2. Register/Verify
        console.log('2. Registering...');
        const regRes = await fetch(`${baseUrl}/verify-and-register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: testPhone,
                code: smsData.code,
                name: 'Admin User',
                email: 'admin@barber.com',
                password: 'password123'
            })
        });
        const regData = await regRes.json();
        console.log('Register Response:', regData);

        // 3. Login
        console.log('3. Logging in...');
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: testPhone,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Response:', loginData);

        if (loginData.customer && loginData.customer.is_admin) {
            console.log('SUCCESS: Admin login verified!');
        } else {
            console.log('WARNING: Not admin or login failed');
        }

    } catch (err) {
        console.error('TEST FAILED:', err);
    }
}

testAuth();
