const cron = require('node-cron');
const Appointment = require('../models/appointment.model');
const { notifyReviewReminder } = require('./notificationHelper');

/**
 * Her 10 dakikada bir çalışan cron job
 * Randevusu bitmiş ve 30 dakika geçmiş müşterilere değerlendirme hatırlatması gönderir
 */
function startReviewReminderCron() {
  // Her 10 dakikada bir çalış
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('🔔 Değerlendirme hatırlatması kontrolü başladı...');

      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const fortyMinutesAgo = new Date(now.getTime() - 40 * 60 * 1000);

      // Randevusu 30-40 dakika önce bitmiş randevuları bul
      const completedAppointments = await Appointment.find({
        status: 'Tamamlandı',
        end_time: {
          $gte: fortyMinutesAgo,
          $lte: thirtyMinutesAgo
        },
        review_reminder_sent: { $ne: true }
      })
        .populate('customer_id')
        .populate('service_id');

      if (completedAppointments.length > 0) {
        console.log(`📝 ${completedAppointments.length} randevu için değerlendirme hatırlatması gönderiliyor...`);

        for (const appointment of completedAppointments) {
          try {
            await notifyReviewReminder(appointment);

            // Hatırlatma gönderildi olarak işaretle
            appointment.review_reminder_sent = true;
            await appointment.save();

            console.log(`✅ ${appointment.customer_id?.name} için hatırlatma gönderildi`);
          } catch (error) {
            console.error(`❌ Hatırlatma gönderilemedi (Appointment: ${appointment._id}):`, error);
          }
        }
      } else {
        console.log('📭 Hatırlatma gönderilecek randevu yok');
      }
    } catch (error) {
      console.error('❌ Değerlendirme hatırlatması cron hatası:', error);
    }
  });

  console.log('✅ Değerlendirme hatırlatması cron job başlatıldı (Her 10 dakikada bir çalışacak)');
}

module.exports = { startReviewReminderCron };
