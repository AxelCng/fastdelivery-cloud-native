const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'El ID del producto es obligatorio'],
      trim: true,
    },
    productName: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [0, 'La cantidad no puede ser negativa'],
      default: 0,
    },
    warehouse: {
      type: String,
      default: 'Almacén Principal',
      trim: true,
    },
    minStock: {
      type: Number,
      default: 10,
      min: [0, 'El stock mínimo no puede ser negativo'],
    },
    lastRestocked: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

module.exports = mongoose.model('Inventory', inventorySchema);
