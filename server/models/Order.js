const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id:        String,
  name:      String,
  price:     Number,
  emoji:     String,
  shopId:    String,
  shopName:  String,
  qty:       Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String },
  items:     [orderItemSchema],
  total:     { type: Number, required: true },
  paymentDetails: {
    name:  String,
    last4: String,
  },
  status:    { type: String, enum: ['pending','completed','cancelled'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
