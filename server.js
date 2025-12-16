require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || process.env.ATLAS_URI || 'mongodb://localhost:27017/barberapp';

mongoose.connect(mongoURI, {
	serverSelectionTimeoutMS: 30000,
	socketTimeoutMS: 45000,
})
	.then(() => {
		console.log('✓ MongoDB Connected');
		console.log('✓ Database:', mongoose.connection.name);
	})
	.catch(err => {
		console.error('✗ MongoDB Connection Error:', err.message);
		console.error('Connection String:', mongoURI.replace(/:[^:@]+@/, ':****@'));
	});

// Routes
const servicesRouter = require('./backend/routes/services');
const appointmentsRouter = require('./backend/routes/appointments');
const customersRouter = require('./backend/routes/customers');
const staffRouter = require('./backend/routes/staff');
const photosRouter = require('./backend/routes/photos');
const reviewsRouter = require('./backend/routes/reviews');
// const notificationsRouter = require('./backend/routes/notifications'); // Dosya eksik
const blockedTimesRouter = require('./backend/routes/blockedTimes');
const serviceExtrasRouter = require('./backend/routes/serviceExtras');
const authRouter = require('./backend/routes/auth'); // Yeni auth rotası

app.use('/services', servicesRouter);
app.use('/auth', authRouter); // Auth rotasını ekle
app.use('/appointments', appointmentsRouter);
app.use('/customers', customersRouter);
app.use('/staff', staffRouter);
app.use('/photos', photosRouter);
app.use('/reviews', reviewsRouter);
// app.use('/notifications', notificationsRouter);
app.use('/blocked-times', blockedTimesRouter);
app.use('/service-extras', serviceExtrasRouter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log('=================================');
	console.log(`✓ Server running on port ${PORT}`);
	console.log(`✓ API URL: http://localhost:${PORT}`);
	console.log('=================================');
});

// Hatırlatıcı: her saat çalışır, randevu başlangıcına 24 saat kalanları bulur ve SMS gönderir
const Appointment = require('./backend/models/appointment.model');

const sendReminderSMS = async () => {
	try {
		const now = new Date();
		const targetStart = new Date(now.getTime() + 24 * 60 * 60000); // 24 saat sonrası
		const windowStart = new Date(targetStart.getTime() - 5 * 60000); // +/- 5 dk tolerans
		const windowEnd = new Date(targetStart.getTime() + 5 * 60000);

		// Randevuları bul ve müşteri bilgisini getir (populate)
		const appointments = await Appointment.find({
			status: 'Onaylandı',
			start_time: { $gte: windowStart, $lte: windowEnd }
		}).populate('customer_id');

		for (const appt of appointments) {
			const customer = appt.customer_id;
			if (customer && customer.phone_number) {
				// SMS gönderme işlemi (API çağrısı)
				// Not: SMS servisi yapılandırması gereklidir
				console.log(`SMS gönderilecek: ${customer.name} - ${customer.phone_number}`);

				/* AÇIKLAMA: Gerçek SMS gönderimi için aşağıdaki bloğu aktif edip yapılandırın
				await fetch(process.env.SMS_API_URL, {
					method: 'POST',
					headers: { 
						'Content-Type': 'application/json', 
						'Authorization': `Bearer ${process.env.SMS_API_KEY}` 
					},
					body: JSON.stringify({ 
						to: customer.phone_number, 
						message: `Hatırlatma: Randevunuz ${appt.start_time}` 
					})
				}).catch(console.error);
				*/
			}
		}
	} catch (err) {
		console.error('Reminder error:', err);
	}
};

// Saatlik başlat (3600000 ms = 1 saat)
setInterval(sendReminderSMS, 3600000);
