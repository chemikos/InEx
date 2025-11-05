require('dotenv').config();

const dbConfig = {
  path: process.env.DB_PATH, //|| './database/inex.db',
};

module.exports = dbConfig;
