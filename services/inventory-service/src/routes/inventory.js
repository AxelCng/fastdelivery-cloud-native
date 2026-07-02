const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// GET /api/inventory — Listar todo el inventario
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find().sort({ updatedAt: -1 });
    res.json({
      success: true,
      data: items,
      count: items.length,
      message: 'Inventario obtenido exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al obtener el inventario',
    });
  }
});

// GET /api/inventory/:id — Obtener ítem de inventario por ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Ítem de inventario no encontrado',
        message: `No existe un registro con el ID: ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: item,
      message: 'Ítem de inventario obtenido exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al obtener el ítem de inventario',
    });
  }
});

// POST /api/inventory — Crear nuevo registro de inventario
router.post('/', async (req, res) => {
  try {
    const { productId, productName, quantity, warehouse, minStock, lastRestocked } = req.body;
    const item = new Inventory({
      productId,
      productName,
      quantity,
      warehouse,
      minStock,
      lastRestocked,
    });
    const savedItem = await item.save();
    res.status(201).json({
      success: true,
      data: savedItem,
      message: 'Registro de inventario creado exitosamente',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Error al crear el registro de inventario',
    });
  }
});

// PUT /api/inventory/:id — Actualizar stock
router.put('/:id', async (req, res) => {
  try {
    const { productId, productName, quantity, warehouse, minStock, lastRestocked } = req.body;
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { productId, productName, quantity, warehouse, minStock, lastRestocked },
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Ítem de inventario no encontrado',
        message: `No existe un registro con el ID: ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: item,
      message: 'Inventario actualizado exitosamente',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Error al actualizar el inventario',
    });
  }
});

module.exports = router;
