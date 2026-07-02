const mongoose = require('mongoose');

// Sub-esquema para los ítems del pedido
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'El ID del producto es obligatorio'],
    },
    productName: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    customerAddress: {
      type: String,
      required: [true, 'La dirección de entrega es obligatoria'],
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'El pedido debe tener al menos un ítem',
      },
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'El monto total no puede ser negativo'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Calcular totalAmount antes de guardar
orderSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
