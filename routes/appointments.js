const express = require('express');
const db = require('../db');
const router = express.Router();
const { pool } = require('../db');
const fetch = require('node-fetch'); // placeholder for SMS

function addMinutesISO(iso, minutes) {
	return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

// Yardımcı: SMS (placeholder)
async function sendSMS(phone, text) {
	// ...replace with real SMS provider integration...
	if (!process.env.SMS_API_URL) return;
	await fetch(process.env.SMS_API_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SMS_API_KEY}` },
		body: JSON.stringify({ to: phone, message: text })
	});
}

// Randevu oluştur
router.post('/', async (req, res) => {
	const { name, phone_number, email, service_id, start_time } = req.body;
	if (!phone_number || !service_id || !start_time) return res.status(400).json({ error: 'Eksik veri' });

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// müşteri varsa al, yoksa ekle
		let customerRes = await client.query('SELECT * FROM customers WHERE phone_number=$1 LIMIT 1', [phone_number]);
		let customer = customerRes.rows[0];
		if (!customer) {
			const insertCust = await client.query(
				'INSERT INTO customers(name,phone_number,email) VALUES($1,$2,$3) RETURNING *',
				[name || null, phone_number, email || null]
			);
			customer = insertCust.rows[0];
		}

		// hizmet bilgisi
		const svcRes = await client.query('SELECT * FROM services WHERE id=$1', [service_id]);
		if (svcRes.rowCount === 0) {
			await client.query('ROLLBACK');
			return res.status(400).json({ error: 'Hizmet bulunamadı' });
		}
		const duration = svcRes.rows[0].duration_minutes;
		const start = new Date(start_time);
		const end = new Date(start.getTime() + duration * 60000);

		// çakışma kontrolü: mevcut onaylı randevular ile overlap kontrolü
		const conflictQ = `
			SELECT 1 FROM appointments
			WHERE status='confirmed' AND NOT (end_time <= $1 OR start_time >= $2)
			LIMIT 1
		`;
		const conflict = await client.query(conflictQ, [start.toISOString(), end.toISOString()]);
		if (conflict.rowCount > 0) {
			await client.query('ROLLBACK');
			return res.status(409).json({ error: 'Seçilen zaman dolu' });
		}

		// randevuyu ekle
		const insertApp = await client.query(
			'INSERT INTO appointments(customer_id,service_id,start_time,end_time,status) VALUES($1,$2,$3,$4,$5) RETURNING *',
			[customer.id, service_id, start.toISOString(), end.toISOString(), 'confirmed']
		);
		await client.query('COMMIT');

		// otomatik onaylandı; bilgilendirme SMS (opsiyonel)
		sendSMS(phone_number, `Randevunuz onaylandı: ${start.toISOString()}`);

		res.status(201).json(insertApp.rows[0]);
	} catch (err) {
		await client.query('ROLLBACK');
		console.error(err);
		res.status(500).json({ error: 'Sunucu hatası' });
	} finally {
		client.release();
	}
});

// Müsaitlik: date=YYYY-MM-DD & service_id
router.get('/availability', async (req, res) => {
	const { date, service_id } = req.query;
	if (!date || !service_id) return res.status(400).json({ error: 'date ve service_id gerekli' });

	const svc = await db.query('SELECT duration_minutes FROM services WHERE id=$1', [service_id]);
	if (svc.rowCount === 0) return res.status(400).json({ error: 'Hizmet bulunamadı' });
	const duration = svc.rows[0].duration_minutes;

	const workingStart = process.env.WORKING_START || '09:00';
	const workingEnd = process.env.WORKING_END || '18:00';
	const dayStart = new Date(`${date}T${workingStart}:00Z`);
	const dayEnd = new Date(`${date}T${workingEnd}:00Z`);

	// alandaki randevuları al
	const rows = (await db.query(
		'SELECT start_time,end_time FROM appointments WHERE start_time < $1 AND end_time > $2 AND status=$3',
		[dayEnd.toISOString(), dayStart.toISOString(), 'confirmed']
	)).rows;

	// slot üret
	const slots = [];
	let cursor = new Date(dayStart);
	while (cursor.getTime() + duration * 60000 <= dayEnd.getTime()) {
		const slotStart = new Date(cursor);
		const slotEnd = new Date(slotStart.getTime() + duration * 60000);

		const conflict = rows.some(r => {
			return !(new Date(r.end_time) <= slotStart || new Date(r.start_time) >= slotEnd);
		});
		if (!conflict) slots.push(slotStart.toISOString());
		cursor = new Date(cursor.getTime() + 15 * 60000); // 15dk adım (ayarlanabilir)
	}

	res.json({ slots });
});

// İptal et
router.put('/:id/cancel', async (req, res) => {
	const { id } = req.params;
	const ap = await db.query('UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *', ['cancelled', id]);
	if (ap.rowCount === 0) return res.status(404).json({ error: 'Randevu bulunamadı' });
	// bildirim (müşteri telefonu al)
	const app = ap.rows[0];
	const cust = (await db.query('SELECT phone_number FROM customers WHERE id=$1', [app.customer_id])).rows[0];
	if (cust) sendSMS(cust.phone_number, `Randevunuz iptal edildi. ${app.start_time}`);
	res.json(ap.rows[0]);
});

// Yeniden planla
router.put('/:id/reschedule', async (req, res) => {
	const { id } = req.params;
	const { new_start_time } = req.body;
	if (!new_start_time) return res.status(400).json({ error: 'new_start_time gerekli' });

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const appRes = await client.query('SELECT * FROM appointments WHERE id=$1 FOR UPDATE', [id]);
		if (appRes.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Randevu bulunamadı' }); }
		const app = appRes.rows[0];
		const svc = (await client.query('SELECT duration_minutes FROM services WHERE id=$1', [app.service_id])).rows[0];
		const duration = svc.duration_minutes;
		const start = new Date(new_start_time);
		const end = new Date(start.getTime() + duration * 60000);

		const conflictQ = `
			SELECT 1 FROM appointments
			WHERE id <> $3 AND status='confirmed' AND NOT (end_time <= $1 OR start_time >= $2)
			LIMIT 1
		`;
		const conflict = await client.query(conflictQ, [start.toISOString(), end.toISOString(), id]);
		if (conflict.rowCount > 0) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Seçilen zaman dolu' }); }

		const upd = await client.query(
			'UPDATE appointments SET start_time=$1,end_time=$2 WHERE id=$3 RETURNING *',
			[start.toISOString(), end.toISOString(), id]
		);
		await client.query('COMMIT');

		const cust = (await db.query('SELECT phone_number FROM customers WHERE id=$1', [app.customer_id])).rows[0];
		if (cust) sendSMS(cust.phone_number, `Randevunuz yeniden planlandı: ${start.toISOString()}`);

		res.json(upd.rows[0]);
	} catch (err) {
		await client.query('ROLLBACK');
		console.error(err);
		res.status(500).json({ error: 'Sunucu hatası' });
	} finally {
		client.release();
	}
});

// Admin takvim (gün/hafta için basit filtre)
router.get('/admin', async (req, res) => {
	const { date } = req.query; // optional YYYY-MM-DD
	let q = `
		SELECT a.*, s.name as service_name, c.name as customer_name, c.phone_number
		FROM appointments a
		JOIN services s ON s.id = a.service_id
		JOIN customers c ON c.id = a.customer_id
		ORDER BY start_time
	`;
	const params = [];
	if (date) {
		q = `
			SELECT a.*, s.name as service_name, c.name as customer_name, c.phone_number
			FROM appointments a
			JOIN services s ON s.id = a.service_id
			JOIN customers c ON c.id = a.customer_id
			WHERE a.start_time >= $1 AND a.start_time < $2
			ORDER BY start_time
		`;
		const start = new Date(`${date}T00:00:00Z`);
		const end = new Date(`${date}T23:59:59Z`);
		params.push(start.toISOString(), end.toISOString());
	}
	const { rows } = await db.query(q, params);
	res.json(rows);
});

module.exports = router;
