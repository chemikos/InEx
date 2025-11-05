const morgan = require('morgan');

const requestLogger = process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined');

module.exports = requestLogger;
