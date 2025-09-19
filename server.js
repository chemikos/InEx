const express = require('express');
const app = express();
const port = 3000;

const categoriesRouter = require('./routes/categories');
const expensesRouter = require('./routes/expenses');
const itemsRouter = require('./routes/items');
const labelsRouter = require('./routes/labels');
const profilesRouter = require('./routes/profiles');


app.use(express.json());

app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/labels', labelsRouter);
app.use('/api/profiles', profilesRouter);

app.get('/', (req, res) => {
  res.send('Aplikacja do monitorowania wydatków działa!');
});

app.listen(port, () => {
  console.log(`Serwer nasłuchuje na http://localhost:${port}`);
});