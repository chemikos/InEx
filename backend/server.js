require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const corsOptions = require('./config/corsOptions');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const port = process.env.PORT || 4000;
const nodeEnv = process.env.NODE_ENV || 'development';

// --- Routers ---
const categoriesRouter = require('./routes/categories');
const expensesRouter = require('./routes/expenses');
const incomesRouter = require('./routes/incomes');
const itemsRouter = require('./routes/items');
const labelsRouter = require('./routes/labels');
const profilesRouter = require('./routes/profiles');
const sourcesRouter = require('./routes/sources');

// --- Middleware ---
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --- Routes ---
app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/labels', labelsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/sources', sourcesRouter);

app.get('/', (req, res) => {
  res.send('✅ Aplikacja InEx działa!');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// --- Error Handler ---
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Serwer działa na http://localhost:${port} (${nodeEnv})`);
});
