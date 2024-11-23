const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'Web3Error') {
    return res.status(400).json({
      error: 'Blockchain interaction failed',
      details: err.message
    });
  }

  if (err.name === 'MongoError') {
    return res.status(500).json({
      error: 'Database operation failed',
      details: err.message
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
};

module.exports = errorHandler; 