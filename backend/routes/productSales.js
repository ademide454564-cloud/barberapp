const express = require('express');
const router = express.Router();
const ProductSale = require('../models/productSale.model');
const Product = require('../models/product.model');

// Tüm ürün satışlarını getir
router.get('/', async (req, res) => {
  try {
    const sales = await ProductSale.find()
      .populate('product_id', 'name category')
      .populate('customer_id', 'name phone_number')
      .sort({ sale_date: -1 });
    res.json(sales);
  } catch (error) {
    console.error('Error fetching product sales:', error);
    res.status(500).json({ message: 'Satışlar yüklenirken hata oluştu' });
  }
});

// Tarih aralığına göre satışları getir
router.get('/by-date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.sale_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await ProductSale.find(query)
      .populate('product_id', 'name category')
      .populate('customer_id', 'name phone_number')
      .sort({ sale_date: -1 });

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales by date range:', error);
    res.status(500).json({ message: 'Satışlar yüklenirken hata oluştu' });
  }
});

// Toplam satış cirosunu getir
router.get('/total-revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.sale_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const result = await ProductSale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_amount' },
          totalSales: { $sum: 1 }
        }
      }
    ]);

    res.json(result[0] || { totalRevenue: 0, totalSales: 0 });
  } catch (error) {
    console.error('Error calculating total revenue:', error);
    res.status(500).json({ message: 'Ciro hesaplanırken hata oluştu' });
  }
});

// Tek satış kaydını getir
router.get('/:id', async (req, res) => {
  try {
    const sale = await ProductSale.findById(req.params.id)
      .populate('product_id')
      .populate('customer_id');

    if (!sale) {
      return res.status(404).json({ message: 'Satış kaydı bulunamadı' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ message: 'Satış kaydı yüklenirken hata oluştu' });
  }
});

// Yeni satış kaydı oluştur
router.post('/', async (req, res) => {
  try {
    const { product_id, customer_id, quantity, unit_price, notes } = req.body;

    if (!product_id || !customer_id || !quantity || !unit_price) {
      return res.status(400).json({ message: 'Ürün, müşteri, adet ve fiyat gereklidir' });
    }

    // Ürün stoğunu kontrol et ve güncelle
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    if (product.stock !== undefined && product.stock < quantity) {
      return res.status(400).json({ message: 'Yetersiz stok' });
    }

    const total_amount = quantity * unit_price;

    const sale = new ProductSale({
      product_id,
      customer_id,
      quantity,
      unit_price,
      total_amount,
      notes,
      sale_date: new Date()
    });

    await sale.save();

    // Stok güncelle (eğer stok takibi varsa)
    if (product.stock !== undefined) {
      product.stock -= quantity;
      await product.save();
    }

    // Populate ederek döndür
    const populatedSale = await ProductSale.findById(sale._id)
      .populate('product_id', 'name category')
      .populate('customer_id', 'name phone_number');

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Satış kaydedilemedi' });
  }
});

// Satış kaydını güncelle
router.put('/:id', async (req, res) => {
  try {
    const { quantity, unit_price, notes } = req.body;

    const sale = await ProductSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Satış kaydı bulunamadı' });
    }

    // Eğer miktar değişiyorsa, stok güncellemesi yap
    if (quantity && quantity !== sale.quantity) {
      const product = await Product.findById(sale.product_id);
      if (product && product.stock !== undefined) {
        // Eski miktarı geri ekle
        product.stock += sale.quantity;
        // Yeni miktarı çıkar
        if (product.stock < quantity) {
          return res.status(400).json({ message: 'Yetersiz stok' });
        }
        product.stock -= quantity;
        await product.save();
      }
    }

    if (quantity) sale.quantity = quantity;
    if (unit_price) sale.unit_price = unit_price;
    if (notes !== undefined) sale.notes = notes;

    sale.total_amount = sale.quantity * sale.unit_price;
    await sale.save();

    const populatedSale = await ProductSale.findById(sale._id)
      .populate('product_id', 'name category')
      .populate('customer_id', 'name phone_number');

    res.json(populatedSale);
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Satış güncellenemedi' });
  }
});

// Satış kaydını sil
router.delete('/:id', async (req, res) => {
  try {
    const sale = await ProductSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Satış kaydı bulunamadı' });
    }

    // Stoğu geri ekle
    const product = await Product.findById(sale.product_id);
    if (product && product.stock !== undefined) {
      product.stock += sale.quantity;
      await product.save();
    }

    await ProductSale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Satış kaydı silindi' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Satış silinemedi' });
  }
});

module.exports = router;
