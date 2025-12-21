const mongoose = require('mongoose');
const Staff = require('./models/staff.model');
require('dotenv').config();

const uri = process.env.ATLAS_URI;
mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB bağlantısı başarılı");

  try {
    // Tüm mevcut staff'ları sil
    await Staff.deleteMany({});
    console.log('Tüm eski personeller silindi');

    // Sadece KAAN HERLİ ekle
    const kaanHerli = new Staff({
      name: 'KAAN HERLİ',
      phone_number: '5541483634',
      specialties: ['Saç Kesimi', 'Sakal Tıraşı', 'Cilt Bakımı'],
      is_active: true
    });

    await kaanHerli.save();
    console.log('✅ KAAN HERLİ eklendi!');
    console.log('Staff ID:', kaanHerli._id);

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
});
