const express = require('express');
const app = express();
const port = 4000;

const cors = require('cors');

const categoriesRouter = require('./routes/categories');
const expensesRouter = require('./routes/expenses');
const incomesRouter = require('./routes/incomes');
const itemsRouter = require('./routes/items');
const labelsRouter = require('./routes/labels');
const profilesRouter = require('./routes/profiles');
const sourcesRouter = require('./routes/sources');

// app.use(
//   cors({
//     origin: 'http://localhost:5173', // ZMIEŃ PORT, JEŚLI VITE/CRA UŻYJE INNEGO
//     // origin: '*', // ZMIEŃ PORT, JEŚLI VITE/CRA UŻYJE INNEGO
//   }),
// );

// Lista dozwolonych źródeł
const allowedOrigins = [
  'http://localhost:5173', // Port dla 'npm run dev'
  'http://localhost:3000', // Port dla 'serve -s dist' (w trybie produkcyjnym)
];

const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/labels', labelsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/sources', sourcesRouter);

app.get('/', (req, res) => {
  res.send('Aplikacja do monitorowania wydatków działa!');
});

app.listen(port, () => {
  console.log(`Serwer nasłuchuje na http://localhost:${port}`);
});
