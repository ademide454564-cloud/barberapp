const mongoose = require('mongoose');
const Customer = require('./models/customer.model');
require('dotenv').config();

// MongoDB URI
const uri = process.env.ATLAS_URI;

mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB veritabanı bağlantısı başarılı");

  try {
    // Admin kullanıcısını kontrol et
    const existingAdmin = await Customer.findOne({ phone_number: '5541483634' });

    if (existingAdmin) {
      console.log('Admin kullanıcı zaten mevcut!');
      console.log('Admin bilgileri:', {
        name: existingAdmin.name,
        phone_number: existingAdmin.phone_number,
        is_admin: existingAdmin.is_admin
      });

      // Admin değilse admin yap
      if (!existingAdmin.is_admin) {
        existingAdmin.is_admin = true;
        await existingAdmin.save();
        console.log('Kullanıcı admin yapıldı!');
      }

      // Şifre güncelle
      existingAdmin.password = '12345';
      await existingAdmin.save();
      console.log('Şifre güncellendi: 12345');

    } else {
      // Yeni admin kullanıcı oluştur
      const adminUser = new Customer({
        name: 'Admin',
        phone_number: '5541483634',
        email: 'admin@barberapp.com',
        password: '12345',
        is_admin: true
      });

      await adminUser.save();
      console.log('Admin kullanıcı başarıyla oluşturuldu!');
      console.log('Telefon: 5541483634');
      console.log('Şifre: 12345');
    }

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
});
