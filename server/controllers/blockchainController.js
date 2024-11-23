const { Web3 } = require('web3');  // Updated import syntax
const NFTMetadata = require('../models/nftMetadata');
const Transaction = require('../models/transaction');
const axios = require('axios');
const ipfsClient = require('ipfs-http-client');
const contractABI = require('../../src/data/data.json');

const { create } = ipfsClient;

// Initialize Web3 with provider
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_KEY));

// NFT Metadata Retrieval
const getNFTMetadata = async (req, res) => {
  try {
    const { contractAddress, tokenId } = req.params;
    
    // Check if metadata exists in MongoDB
    let metadata = await NFTMetadata.findOne({ contractAddress, tokenId });
    
    if (!metadata) {
      // Create contract instance using the ABI from data.json
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      
      // Get token URI - updated method call syntax
      const tokenURI = await contract.methods.tokenURI(tokenId).call();
      
      // Fetch metadata from URI
      const response = await axios.get(tokenURI);
      const nftMetadata = response.data;
      
      // Store in MongoDB
      metadata = await NFTMetadata.create({
        contractAddress,
        tokenId,
        metadata: {
          name: nftMetadata.name,
          description: nftMetadata.description,
          imageUrl: nftMetadata.image
        }
      });
    }
    
    res.status(200).json(metadata);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Transaction Tracking
const getTransactions = async (req, res) => {
  try {
    const { address, startDate, endDate } = req.params;
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    
    // Fetch transactions from Etherscan
    const response = await axios.get(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`
    );
    
    let transactions = response.data.result.slice(0, 5);
    
    // Filter by date if provided
    if (startDate && endDate) {
      transactions = transactions.filter(tx => {
        const txDate = new Date(tx.timeStamp * 1000);
        return txDate >= new Date(startDate) && txDate <= new Date(endDate);
      });
    }
    
    // Store in MongoDB - updated to use Web3.utils
    await Transaction.insertMany(
      transactions.map(tx => ({
        address,
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: web3.utils.fromWei(tx.value),  // Removed 'ether' parameter as it's default
        timestamp: new Date(tx.timeStamp * 1000)
      }))
    );
    
    res.status(200).json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Token Balance Lookup
const getTokenBalance = async (req, res) => {
  try {
    const { contractAddress, walletAddress } = req.params;
    
    // Create contract instance using ERC20 ABI from data.json
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    
    // Get token balance and decimals - updated Promise.all syntax
    const [balance, decimals] = await Promise.all([
      contract.methods.balanceOf(walletAddress).call(),
      contract.methods.decimals().call()
    ]);
    
    // Convert balance to proper format using Web3.utils
    const formattedBalance = Number(balance) / Math.pow(10, decimals);
    
    res.status(200).json({ 
      address: walletAddress,
      balance: formattedBalance,
      contractAddress: contractAddress
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Token Transfer - updated with Web3.js v4 syntax
const transferTokens = async (req, res) => {
  try {
    const { contractAddress, from, to, amount } = req.body;
    
    // Create contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    
    // Create and send transaction
    const tx = await contract.methods.transfer(to, amount).send({
      from,
      maxPriorityFeePerGas: null,
      maxFeePerGas: null
    });
    
    // Store transaction in MongoDB
    await Transaction.create({
      address: from,
      hash: tx.transactionHash,
      from,
      to,
      value: amount,
      timestamp: new Date()
    });
    
    res.status(200).json(tx);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Store data on IPFS
const storeIPFSData = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Add data to IPFS
    const result = await create(JSON.stringify(data));
    const hash = result.path;

    // Store hash in MongoDB
    await Transaction.create({
      address: req.body.address || 'anonymous',
      hash: hash,
      timestamp: new Date(),
      type: 'ipfs'
    });

    res.status(200).json({ 
      message: 'Data stored successfully',
      hash: hash 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get IPFS data
const getIPFSData = async (req, res) => {
  try {
    const { hash } = req.params;
    
    // Get data from IPFS
    const stream = ipfsClient.cat(hash);
    let data = '';

    for await (const chunk of stream) {
      data += chunk.toString();
    }

    res.status(200).json({ data: JSON.parse(data) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getNFTMetadata,
  getTransactions,
  storeIPFSData,
  getIPFSData,
  getTokenBalance,
  transferTokens
};