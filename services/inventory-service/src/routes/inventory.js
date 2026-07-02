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

// GET /api/inventory/:id — Obtener ítem de inventario por ID o por productId
router.get('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const item = await Inventory.findOne({
      $or: [
        { productId: req.params.id },
        ...(isObjectId ? [{ _id: req.params.id }] : [])
      ]
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Ítem de inventario no encontrado',
        message: `No existe un registro con el ID o Product ID: ${req.params.id}`,
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

// PUT /api/inventory/:id — Actualizar stock por ID o por productId
router.put('/:id', async (req, res) => {
  try {
    const { productId, productName, quantity, warehouse, minStock, lastRestocked } = req.body;
    const mongoose = require('mongoose');
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const filter = {
      $or: [
        { productId: req.params.id },
        ...(isObjectId ? [{ _id: req.params.id }] : [])
      ]
    };
    
    const item = await Inventory.findOneAndUpdate(
      filter,
      { productId, productName, quantity, warehouse, minStock, lastRestocked },
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Ítem de inventario no encontrado',
        message: `No existe un registro con el ID o Product ID: ${req.params.id}`,
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

// PUT /api/inventory/product/:productId/reduce — Decrementar stock de un producto
router.put('/product/:productId/reduce', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad a reducir debe ser mayor que 0',
      });
    }

    const item = await Inventory.findOne({ productId: req.params.productId });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado',
        message: `No existe un registro de inventario para el producto ID: ${req.params.productId}`,
      });
    }

    if (item.quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Stock insuficiente',
        message: `El stock disponible (${item.quantity}) es menor que la cantidad solicitada (${quantity})`,
      });
    }

    item.quantity -= quantity;
    const savedItem = await item.save();

    res.json({
      success: true,
      data: savedItem,
      message: 'Stock reducido exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al reducir el stock del inventario',
    });
  }
});

module.exports = router;
