const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  hash: String,
  from: String,
  to: String,
  value: String,
  timestamp: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema); 