const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products — Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: products,
      count: products.length,
      message: 'Productos obtenidos exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al obtener los productos',
    });
  }
});

// GET /api/products/:id — Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        message: `No existe un producto con el ID: ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: product,
      message: 'Producto obtenido exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al obtener el producto',
    });
  }
});

// POST /api/products — Crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    const product = new Product({ name, description, price, category, imageUrl });
    const savedProduct = await product.save();
    res.status(201).json({
      success: true,
      data: savedProduct,
      message: 'Producto creado exitosamente',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Error al crear el producto',
    });
  }
});

// PUT /api/products/:id — Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, imageUrl },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
        message: `No existe un producto con el ID: ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: product,
      message: 'Producto actualizado exitosamente',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Error al actualizar el producto',
    });
  }
});

module.exports = router;
