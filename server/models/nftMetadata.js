const mongoose = require('mongoose');

const NFTMetadataSchema = new mongoose.Schema({
  contractAddress: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true
  },
  metadata: {
    name: String,
    description: String,
    imageUrl: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NFTMetadata', NFTMetadataSchema); 