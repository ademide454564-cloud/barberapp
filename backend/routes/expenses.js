const express = require('express');
const router = express.Router();
const Expense = require('../models/expense.model');

// Tüm masrafları getir
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Masraflar getirilemedi', error: error.message });
  }
});

// ID ile masraf getir
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Masraf bulunamadı' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ message: 'Masraf getirilemedi', error: error.message });
  }
});

// Yeni masraf ekle
router.post('/', async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    // Validasyon
    if (!category || !amount || !description) {
      return res.status(400).json({ message: 'Kategori, tutar ve açıklama gereklidir' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Tutar 0\'dan büyük olmalıdır' });
    }

    const expense = new Expense({
      category,
      amount,
      description,
      date: date || Date.now(),
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Masraf eklenemedi', error: error.message });
  }
});

// Masraf güncelle
router.put('/:id', async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Masraf bulunamadı' });
    }

    // Güncelleme
    if (category) expense.category = category;
    if (amount) expense.amount = amount;
    if (description) expense.description = description;
    if (date) expense.date = date;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Masraf güncellenemedi', error: error.message });
  }
});

// Masraf sil
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Masraf bulunamadı' });
    }
    res.json({ message: 'Masraf silindi', expense });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Masraf silinemedi', error: error.message });
  }
});

// Kategoriye göre masrafları getir
router.get('/category/:category', async (req, res) => {
  try {
    const expenses = await Expense.find({ category: req.params.category }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    res.status(500).json({ message: 'Masraflar getirilemedi', error: error.message });
  }
});

// Tarih aralığına göre masrafları getir
router.get('/date-range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const expenses = await Expense.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses by date range:', error);
    res.status(500).json({ message: 'Masraflar getirilemedi', error: error.message });
  }
});

module.exports = router;
