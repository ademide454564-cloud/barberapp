const mongoose = require('mongoose');
require('dotenv').config();

const Service = require('./models/service.model');
const Staff = require('./models/staff.model');
const Appointment = require('./models/appointment.model');
const Customer = require('./models/customer.model');

const uri = process.env.ATLAS_URI;

mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB bağlantısı başarılı\n");

  try {
    const serviceCount = await Service.countDocuments();
    const staffCount = await Staff.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    const customerCount = await Customer.countDocuments();

    console.log('=== VERİTABANI İSTATİSTİKLERİ ===');
    console.log(`Hizmetler: ${serviceCount}`);
    console.log(`Personel: ${staffCount}`);
    console.log(`Randevular: ${appointmentCount}`);
    console.log(`Müşteriler: ${customerCount}`);
    console.log('\n=== HİZMETLER ===');
    const services = await Service.find().limit(20);
    services.forEach(s => console.log(`- ${s.name} (${s.price}₺)`));

    if (serviceCount > 8) {
      console.log(`\n⚠️  UYARI: ${serviceCount} hizmet var, 8 olmalıydı!`);
      console.log('Muhtemelen seed.js birden fazla kez çalıştırıldı.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
});
