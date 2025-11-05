const errorHandler = (err, req, res, next) => {
  console.error('❌ Błąd serwera:', err.message);

  res.status(500).json({
    error: 'Wewnętrzny błąd serwera',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

module.exports = errorHandler;
