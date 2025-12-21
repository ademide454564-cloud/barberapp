const router = require('express').Router();
let Appointment = require('../models/appointment.model');
let Customer = require('../models/customer.model');
let Service = require('../models/service.model');
let BlockedTime = require('../models/blockedTime.model');
const { sendSMS } = require('../utils/smsService');
const { sendPushNotification } = require('../utils/pushNotification');

// Geçici kod saklama (production'da Redis kullanılmalı)
const verificationCodes = new Map();

// 6 haneli rastgele kod üret
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Kod gönderme endpoint'i
router.route('/send-verification').post(async (req, res) => {
    const { phone_number } = req.body;

    try {
        // 6 haneli kod üret
        const code = generateVerificationCode();

        // Kodu 5 dakika süreyle sakla
        verificationCodes.set(phone_number, {
            code: code,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 dakika
        });

        // SMS gönderimi
        const smsMessage = `KAAN HERLİ KUAFÖR SALONU\n\nDoğrulama Kodunuz: ${code}\n\nBu kodu kimseyle paylaşmayın.\n\nKod 5 dakika geçerlidir.`;

        const smsResult = await sendSMS(phone_number, smsMessage);

        res.json({
            message: 'Verification code sent!',
            sms_sent: smsResult.success,
            // DEV MODE: Kodu response'da gönder (production'da kaldırılmalı!)
            code: code // Sadece test için!
        });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Kod doğrulama endpoint'i
router.route('/verify-code').post(async (req, res) => {
    const { phone_number, code } = req.body;

    try {
        const storedData = verificationCodes.get(phone_number);

        if (!storedData) {
            return res.status(400).json({ verified: false, message: 'Kod bulunamadı veya süresi dolmuş' });
        }

        // Süre kontrolü
        if (Date.now() > storedData.expiresAt) {
            verificationCodes.delete(phone_number);
            return res.status(400).json({ verified: false, message: 'Kod süresi dolmuş' });
        }

        // Kod kontrolü
        if (storedData.code !== code) {
            return res.status(400).json({ verified: false, message: 'Geçersiz kod' });
        }

        // Kod doğru, sil
        verificationCodes.delete(phone_number);

        res.json({
            verified: true,
            message: 'Telefon numarası doğrulandı'
        });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/').get((req, res) => {
  Appointment.find()
    .populate('customer_id')
    .populate('service_id')
    .populate('staff_id')
    .then(appointments => res.json(appointments))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post(async (req, res) => {
    const { customer, service_id, staff_id, start_time } = req.body;
    const { name, phone_number, email } = customer;

    try {
        let existingCustomer = await Customer.findOne({ phone_number: phone_number });
        if (!existingCustomer) {
            existingCustomer = new Customer({
                name,
                phone_number,
                email
            });
            await existingCustomer.save();
        }

        const service = await Service.findById(service_id);
        if (!service) {
            return res.status(400).json('Error: Service not found');
        }

        const end_time = new Date(new Date(start_time).getTime() + service.duration_minutes * 60000);

        const conflictingAppointment = await Appointment.findOne({
            staff_id,
            status: { $ne: 'İptal Edildi' },
            $or: [
                { start_time: { $lt: end_time, $gte: start_time } },
                { end_time: { $lte: end_time, $gt: start_time } }
            ]
        });

        if (conflictingAppointment) {
            return res.status(400).json('Error: Appointment time conflicts with an existing appointment.');
        }

        const newAppointment = new Appointment({
            customer_id: existingCustomer._id,
            service_id,
            staff_id,
            start_time,
            end_time,
            status: 'Beklemede',
            is_verified: false
        });

        await newAppointment.save();

        // SMS gönderimi
        const smsMessage = `KAAN HERLİ KUAFÖR SALONU\n\nMerhaba ${name},\n\nRandevunuz başarıyla oluşturuldu.\n\nHizmet: ${service.name}\nTarih: ${new Date(start_time).toLocaleDateString('tr-TR')}\nSaat: ${new Date(start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}\n\nBizi tercih ettiğiniz için teşekkür ederiz.\n\nKaan Herli Kuaför Salonu`;

        const smsResult = await sendSMS(phone_number, smsMessage);

        res.json({
            message: 'Appointment added!',
            appointment_id: newAppointment._id,
            sms_sent: smsResult.success
        });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});


router.route('/:id').delete((req, res) => {
    Appointment.findByIdAndDelete(req.params.id)
        .then(() => res.json('Appointment deleted.'))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post(async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate('service_id');
        const oldStatus = appointment.status;

        // Status güncellemesi
        if (req.body.status) {
            appointment.status = req.body.status;

            if (oldStatus !== 'İptal Edildi' && req.body.status === 'İptal Edildi') {
                await Customer.findByIdAndUpdate(
                    appointment.customer_id,
                    { $inc: { cancellation_count: 1 } }
                );
            }
        }

        // Tarih güncellemesi (reschedule)
        if (req.body.start_time) {
            const new_start_time = new Date(req.body.start_time);
            const service = appointment.service_id;
            const new_end_time = new Date(new_start_time.getTime() + service.duration_minutes * 60000);

            // Çakışma kontrolü (mevcut randevuyu hariç tut)
            const conflictingAppointment = await Appointment.findOne({
                _id: { $ne: appointment._id },
                staff_id: appointment.staff_id,
                status: { $ne: 'İptal Edildi' },
                $or: [
                    { start_time: { $lt: new_end_time, $gte: new_start_time } },
                    { end_time: { $lte: new_end_time, $gt: new_start_time } }
                ]
            });

            if (conflictingAppointment) {
                return res.status(400).json('Error: Appointment time conflicts with an existing appointment.');
            }

            appointment.start_time = new_start_time;
            appointment.end_time = new_end_time;
        }

        await appointment.save();
        res.json('Appointment updated!');
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/approve/:id').post(async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('customer_id')
            .populate('service_id')
            .populate('staff_id');

        appointment.status = 'Onaylandı';
        await appointment.save();

        // Push notification gönder
        if (appointment.customer_id && appointment.customer_id.push_token) {
            const appointmentDate = new Date(appointment.start_time);
            const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });

            await sendPushNotification(
                appointment.customer_id.push_token,
                '✅ Randevunuz Onaylandı!',
                `${formattedDate} tarihli ${appointment.service_id?.name} randevunuz onaylandı.`,
                {
                    type: 'appointment_approved',
                    appointmentId: appointment._id
                }
            );
        }

        res.json('Appointment approved!');
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/cancel/:id').post(async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        const oldStatus = appointment.status;
        appointment.status = 'İptal Edildi';

        if (oldStatus !== 'İptal Edildi') {
            await Customer.findByIdAndUpdate(
                appointment.customer_id,
                { $inc: { cancellation_count: 1 } }
            );
        }

        await appointment.save();
        res.json('Appointment cancelled!');
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/verify/:id').post(async (req, res) => {
    const { code } = req.body;

    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json('Appointment not found');
        }

        if (appointment.verification_code !== code) {
            return res.status(400).json('Invalid verification code');
        }

        appointment.is_verified = true;
        appointment.status = 'Onaylandı';
        await appointment.save();

        res.json({ message: 'Appointment verified successfully', appointment });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/by-phone').post(async (req, res) => {
    const { phone_number } = req.body;

    try {
        // Telefon numarasından müşteriyi bul
        const customer = await Customer.findOne({ phone_number });

        if (!customer) {
            return res.json([]);
        }

        // Müşteriye ait randevuları bul (son 30 günlük + gelecekteki)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const appointments = await Appointment.find({
            customer_id: customer._id,
            status: { $ne: 'İptal Edildi' },
            start_time: { $gte: thirtyDaysAgo }
        })
        .populate('service_id')
        .populate('staff_id')
        .populate('customer_id')
        .sort('-start_time'); // En yeni önce

        res.json(appointments);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/available-slots').post(async (req, res) => {
    const { staff_id, date, service_id } = req.body;

    try {
        const service = await Service.findById(service_id);
        if (!service) {
            return res.status(400).json('Service not found');
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(9, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(20, 0, 0, 0);

        // Kapalı zamanları kontrol et
        const blockedTimes = await BlockedTime.find({
            $or: [
                // Tam gün kapalı
                {
                    type: 'full_day',
                    date: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                },
                // Belirli saat aralığı kapalı
                {
                    type: 'time_range',
                    date: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    }
                },
                // Tekrarlayan kapalı günler (örn: her pazar)
                {
                    is_recurring: true,
                    recurring_day: startOfDay.getDay()
                }
            ]
        });

        // Eğer tam gün kapalıysa, boş array dön
        if (blockedTimes.some(bt => bt.type === 'full_day')) {
            return res.json([]);
        }

        const appointments = await Appointment.find({
            staff_id,
            status: { $ne: 'İptal Edildi' },
            start_time: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        }).sort('start_time');

        const slots = [];
        const slotDuration = service.duration_minutes;
        let currentTime = new Date(startOfDay);

        while (currentTime < endOfDay) {
            const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

            const isConflict = appointments.some(apt => {
                const aptStart = new Date(apt.start_time);
                const aptEnd = new Date(apt.end_time);
                return (currentTime < aptEnd && slotEnd > aptStart);
            });

            // Kapalı saat aralığında mı kontrol et
            const isBlocked = blockedTimes.some(bt => {
                if (bt.type === 'time_range') {
                    const [startHour, startMin] = bt.start_time.split(':');
                    const [endHour, endMin] = bt.end_time.split(':');

                    const blockStart = new Date(currentTime);
                    blockStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

                    const blockEnd = new Date(currentTime);
                    blockEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

                    return (currentTime < blockEnd && slotEnd > blockStart);
                }
                return false;
            });

            if (!isConflict && !isBlocked) {
                slots.push({
                    start_time: new Date(currentTime),
                    end_time: new Date(slotEnd)
                });
            }

            currentTime = new Date(currentTime.getTime() + 30 * 60000);
        }

        res.json(slots);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Ödeme bilgisi güncelleme
router.route('/update-payment/:id').post(async (req, res) => {
    const { payment_method, amount, is_paid, payment_note } = req.body;

    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('customer_id')
            .populate('service_id');

        if (!appointment) {
            return res.status(404).json('Randevu bulunamadı');
        }

        const wasNotCompleted = appointment.status !== 'Tamamlandı';

        appointment.payment_method = payment_method;
        appointment.amount = amount || 0;
        appointment.is_paid = is_paid || false;
        appointment.payment_note = payment_note || '';

        // Ödeme yapıldıysa ve onaylandıysa, durumu "Tamamlandı" yap
        if (is_paid && appointment.status === 'Onaylandı') {
            appointment.status = 'Tamamlandı';

            // İlk kez tamamlanıyorsa değerlendirme bildirimi gönder
            if (wasNotCompleted && appointment.customer_id && appointment.customer_id.push_token) {
                await sendPushNotification(
                    appointment.customer_id.push_token,
                    '⭐ Deneyiminizi Değerlendirin',
                    `${appointment.service_id?.name} hizmetimizi nasıl buldunuz? Görüşleriniz bizim için değerli!`,
                    {
                        type: 'review_request',
                        appointmentId: appointment._id
                    }
                );
            }
        }

        await appointment.save();

        res.json({ message: 'Ödeme bilgisi güncellendi', appointment });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Ciro istatistikleri
router.route('/revenue-stats').post(async (req, res) => {
    const { start_date, end_date } = req.body;

    try {
        const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1)); // Ayın ilk günü
        const endDate = end_date ? new Date(end_date) : new Date(); // Bugün

        const appointments = await Appointment.find({
            is_paid: true,
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('service_id');

        // Ödeme yöntemine göre grupla
        const stats = {
            total_revenue: 0,
            nakit: 0,
            kart: 0,
            eft: 0,
            appointment_count: appointments.length,
            by_method: {
                'Nakit': { count: 0, amount: 0 },
                'Kart': { count: 0, amount: 0 },
                'EFT': { count: 0, amount: 0 }
            }
        };

        appointments.forEach(apt => {
            const amount = apt.amount || 0;
            stats.total_revenue += amount;

            if (apt.payment_method === 'Nakit') {
                stats.nakit += amount;
                stats.by_method['Nakit'].count++;
                stats.by_method['Nakit'].amount += amount;
            } else if (apt.payment_method === 'Kart') {
                stats.kart += amount;
                stats.by_method['Kart'].count++;
                stats.by_method['Kart'].amount += amount;
            } else if (apt.payment_method === 'EFT') {
                stats.eft += amount;
                stats.by_method['EFT'].count++;
                stats.by_method['EFT'].amount += amount;
            }
        });

        res.json(stats);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Randevu saatini değiştir (Drag & Drop için)
router.route('/reschedule/:id').post(async (req, res) => {
    const { start_time } = req.body;

    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('customer_id')
            .populate('service_id');

        if (!appointment) {
            return res.status(404).json('Appointment not found');
        }

        // Yeni saatte başka randevu var mı kontrol et
        const conflictingAppointment = await Appointment.findOne({
            _id: { $ne: req.params.id },
            start_time: new Date(start_time),
            status: { $ne: 'İptal Edildi' }
        });

        if (conflictingAppointment) {
            return res.status(400).json({ message: 'Bu saatte başka bir randevu var' });
        }

        // Saati güncelle
        appointment.start_time = new Date(start_time);
        await appointment.save();

        res.json({ message: 'Randevu saati güncellendi', appointment });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

module.exports = router;
