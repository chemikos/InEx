const express = require('express');
const app = express();
const port = 3000;

const categoriesRouter = require('./routes/categories');
const expensesRouter = require('./routes/expenses');
const incomesRouter = require('./roures/incomes');
const itemsRouter = require('./routes/items');
const labelsRouter = require('./routes/labels');
const profilesRouter = require('./routes/profiles');
const sourcesRouter = require('./routes/sources');

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
