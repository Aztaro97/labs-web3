const mongoose = require('mongoose');

const IPFSDataSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('IPFSData', IPFSDataSchema); 