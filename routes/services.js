const express = require('express');
const db = require('../db');
const router = express.Router();

// Listele
router.get('/', async (req, res) => {
	const { rows } = await db.query('SELECT * FROM services ORDER BY id');
	res.json(rows);
});

// Yeni hizmet ekle
router.post('/', async (req, res) => {
	const { name, duration_minutes, price } = req.body;
	const { rows } = await db.query(
		'INSERT INTO services(name,duration_minutes,price) VALUES($1,$2,$3) RETURNING *',
		[name, duration_minutes, price]
	);
	res.status(201).json(rows[0]);
});

// Güncelle
router.put('/:id', async (req, res) => {
	const { id } = req.params;
	const { name, duration_minutes, price } = req.body;
	const { rows } = await db.query(
		'UPDATE services SET name=$1,duration_minutes=$2,price=$3 WHERE id=$4 RETURNING *',
		[name, duration_minutes, price, id]
	);
	res.json(rows[0]);
});

module.exports = router;
