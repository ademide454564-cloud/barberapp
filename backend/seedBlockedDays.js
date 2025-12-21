const mongoose = require('mongoose');
const BlockedTime = require('./models/blockedTime.model');
require('dotenv').config();

const uri = process.env.ATLAS_URI;
mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log("MongoDB bağlantısı başarılı");

  try {
    // Önce eski recurring blocked times'ları temizle
    await BlockedTime.deleteMany({ is_recurring: true });
    console.log('Eski tekrarlayan kapalı günler silindi');

    // Pazar günlerini kapalı yap (recurring_day: 0 = Pazar)
    const sunday = new BlockedTime({
      type: 'full_day',
      is_recurring: true,
      recurring_day: 0, // 0 = Pazar
      reason: 'Pazar günleri kapalıyız'
    });

    await sunday.save();
    console.log('✅ Pazar günleri kapalı olarak işaretlendi!');

    // İsterseniz başka günler de ekleyebilirsiniz:
    // const monday = new BlockedTime({
    //   type: 'full_day',
    //   is_recurring: true,
    //   recurring_day: 1, // 1 = Pazartesi
    //   reason: 'Pazartesi günleri kapalıyız'
    // });
    // await monday.save();

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
});
