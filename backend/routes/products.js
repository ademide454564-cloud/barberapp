const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');

// Tüm aktif ürünleri getir (müşteriler için)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Ürünler yüklenirken hata oluştu' });
  }
});

// Tüm ürünleri getir (admin için)
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ message: 'Ürünler yüklenirken hata oluştu' });
  }
});

// Tek ürün detayı
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Ürün yüklenirken hata oluştu' });
  }
});

// Yeni ürün ekle
router.post('/', async (req, res) => {
  try {
    const { name, description, price, image_url, stock, category, is_active } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Ürün adı ve fiyat gereklidir' });
    }

    const product = new Product({
      name,
      description,
      price,
      image_url,
      stock,
      category,
      is_active
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Ürün eklenirken hata oluştu' });
  }
});

// Ürün güncelle
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, image_url, stock, category, is_active } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, image_url, stock, category, is_active },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Ürün güncellenirken hata oluştu' });
  }
});

// Ürün sil
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.json({ message: 'Ürün başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Ürün silinirken hata oluştu' });
  }
});

module.exports = router;
