const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('./models/service.model');
const Staff = require('./models/staff.model');

const uri = process.env.ATLAS_URI;

mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB database connection established successfully");

  try {
    // Hizmetleri ekle
    const existingServices = await Service.find();
    if (existingServices.length === 0) {
      const services = [
        { name: 'Saç Kesimi', duration_minutes: 45, price: 150 },
        { name: 'Sakal Tıraşı', duration_minutes: 30, price: 100 },
        { name: 'Saç + Sakal', duration_minutes: 60, price: 220 },
        { name: 'Cilt Bakımı', duration_minutes: 40, price: 180 },
        { name: 'Kaş Dizaynı', duration_minutes: 20, price: 80 },
        { name: 'Bıyık Tıraşı', duration_minutes: 15, price: 50 },
        { name: 'Saç Boyama', duration_minutes: 90, price: 300 },
        { name: 'Ağda', duration_minutes: 35, price: 120 },
      ];

      await Service.insertMany(services);
      console.log('Hizmetler eklendi!');
    } else {
      console.log('Hizmetler zaten mevcut.');
    }

    // Personel ekle
    const existingStaff = await Staff.find();
    if (existingStaff.length === 0) {
      const staff = [
        {
          name: 'Kaan Herli',
          phone_number: '0555 123 45 67',
          email: 'kaan@barbershop.com',
          specialties: ['Saç Kesimi', 'Sakal Tıraşı', 'Saç Boyama'],
          is_active: true,
        },
      ];

      await Staff.insertMany(staff);
      console.log('Personel eklendi!');
    } else {
      console.log('Personel zaten mevcut.');
    }

    console.log('\nÖrnek veriler başarıyla eklendi!');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
});
