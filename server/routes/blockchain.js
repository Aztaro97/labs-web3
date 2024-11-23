const express = require('express');
const router = express.Router();
const { 
  getNFTMetadata,
  getTransactions,
  storeIPFSData,
  getIPFSData,
  getTokenBalance,
  transferTokens
} = require('../controllers/blockchainController');

// NFT Metadata endpoint
router.get('/nft/:contractAddress/:tokenId', getNFTMetadata);

// Transaction tracking endpoints
router.get('/transactions/:address', getTransactions);
router.get('/transactions/:address/:startDate/:endDate', getTransactions);

// IPFS storage endpoints
router.post('/ipfs', storeIPFSData);
router.get('/ipfs/:hash', getIPFSData);

// Token balance endpoint
router.get('/balance/:contractAddress/:walletAddress', getTokenBalance);

// Token transfer endpoint
router.post('/transfer', transferTokens);

module.exports = router; 