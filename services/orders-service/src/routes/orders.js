const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders — Listar todos los pedidos
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: orders,
      count: orders.length,
      message: 'Pedidos obtenidos exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al obtener los pedidos',
    });
  }
});

// GET /api/orders/:id — Obtener pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
        message: `No existe un pedido con el ID: ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: order,
      message: 'Pedido obtenido exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al obtener el pedido',
    });
  }
});

// POST /api/orders — Crear nuevo pedido
router.post('/', async (req, res) => {
  try {
    const { customerName, customerAddress, customerPhone, items } = req.body;
    const order = new Order({
      customerName,
      customerAddress,
      customerPhone,
      items,
    });
    const savedOrder = await order.save();
    res.status(201).json({
      success: true,
      data: savedOrder,
      message: 'Pedido creado exitosamente',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Error al crear el pedido',
    });
  }
});

// PUT /api/orders/:id — Actualizar estado del pedido
router.put('/:id', async (req, res) => {
  try {
    const { customerName, customerAddress, customerPhone, items, status } = req.body;

    const updateData = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerAddress !== undefined) updateData.customerAddress = customerAddress;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (status !== undefined) updateData.status = status;
    if (items !== undefined) {
      updateData.items = items;
      // Recalcular totalAmount si se actualizan los ítems
      updateData.totalAmount = items.reduce(
        (total, item) => total + item.quantity * item.unitPrice,
        0
      );
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
        message: `No existe un pedido con el ID: ${req.params.id}`,
      });
    }
    res.json({
      success: true,
      data: order,
      message: 'Pedido actualizado exitosamente',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Error al actualizar el pedido',
    });
  }
});

module.exports = router;
