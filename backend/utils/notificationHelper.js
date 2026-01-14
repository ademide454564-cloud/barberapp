const Notification = require('../models/notification.model');
const Staff = require('../models/staff.model');

/**
 * Admin'e bildirim gönder
 */
async function sendAdminNotification({ title, message, type, data }) {
  try {
    // Tüm admin staff'ları bul (KAAN HERLİ)
    const admins = await Staff.find();

    const notifications = admins.map(admin => ({
      recipient_type: 'admin',
      recipient_id: admin._id,
      recipient_type_model: 'Staff',
      title,
      message,
      type,
      data,
      is_read: false,
      push_sent: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ ${notifications.length} admin bildirimi oluşturuldu: ${title}`);
    }

    return notifications;
  } catch (error) {
    console.error('❌ Admin bildirimi oluşturulurken hata:', error);
    throw error;
  }
}

/**
 * Müşteriye bildirim gönder
 */
async function sendCustomerNotification({ customerId, title, message, type, data }) {
  try {
    const notification = new Notification({
      recipient_type: 'customer',
      recipient_id: customerId,
      recipient_type_model: 'Customer',
      title,
      message,
      type,
      data,
      is_read: false,
      push_sent: false
    });

    await notification.save();
    console.log(`✅ Müşteri bildirimi oluşturuldu: ${title}`);
    return notification;
  } catch (error) {
    console.error('❌ Müşteri bildirimi oluşturulurken hata:', error);
    throw error;
  }
}

/**
 * Yeni randevu bildirimi (Admin'e)
 */
async function notifyNewAppointment(appointment) {
  const customerName = appointment.customer_id?.name || 'Müşteri';
  const serviceName = appointment.service_id?.name || 'Hizmet';
  const appointmentTime = new Date(appointment.start_time).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  return sendAdminNotification({
    title: '🆕 Yeni Randevu',
    message: `${customerName} - ${serviceName} için randevu aldı (${appointmentTime})`,
    type: 'appointment',
    data: {
      appointment_id: appointment._id,
      customer_id: appointment.customer_id?._id,
      customer_name: customerName,
      service_name: serviceName,
      appointment_time: appointment.start_time
    }
  });
}

/**
 * Randevu iptal bildirimi (Admin'e)
 */
async function notifyCancellation(appointment) {
  const customerName = appointment.customer_id?.name || 'Müşteri';
  const serviceName = appointment.service_id?.name || 'Hizmet';
  const appointmentTime = new Date(appointment.start_time).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  return sendAdminNotification({
    title: '❌ Randevu İptali',
    message: `${customerName} randevusunu iptal etti (${serviceName} - ${appointmentTime})`,
    type: 'cancellation',
    data: {
      appointment_id: appointment._id,
      customer_id: appointment.customer_id?._id,
      customer_name: customerName,
      service_name: serviceName,
      appointment_time: appointment.start_time
    }
  });
}

/**
 * Değerlendirme hatırlatması (Müşteriye)
 */
async function notifyReviewReminder(appointment) {
  const serviceName = appointment.service_id?.name || 'hizmet';

  return sendCustomerNotification({
    customerId: appointment.customer_id._id || appointment.customer_id,
    title: '⭐ Deneyiminizi Değerlendirin',
    message: `${serviceName} hizmetimizi nasıl buldunuz? Görüşleriniz bizim için çok değerli!`,
    type: 'reminder',
    data: {
      appointment_id: appointment._id,
      service_name: serviceName,
      appointment_time: appointment.start_time
    }
  });
}

/**
 * Yeni yorum bildirimi (Admin'e)
 */
async function notifyNewReview(review) {
  const customerName = review.customer_id?.name || 'Müşteri';
  const rating = review.rating;
  const stars = '⭐'.repeat(rating);

  return sendAdminNotification({
    title: '💬 Yeni Değerlendirme',
    message: `${customerName} yeni bir değerlendirme yaptı ${stars}`,
    type: 'review',
    data: {
      review_id: review._id,
      customer_id: review.customer_id?._id,
      customer_name: customerName
    }
  });
}

module.exports = {
  sendAdminNotification,
  sendCustomerNotification,
  notifyNewAppointment,
  notifyCancellation,
  notifyReviewReminder,
  notifyNewReview
};
