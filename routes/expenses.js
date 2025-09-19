const express = require('express');
const router = express.Router();
const db = require('../database');
const util = require('util');

db.getPromise = util.promisify(db.get);
db.allPromise = util.promisify(db.all);
db.runPromise = function (...args) {
  return new Promise((resolve, reject) => {
    db.run(...args, function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const {
  checkProfileExists,
  checkItemExists,
  validateId,
  validateName,
  validateAmount,
  validateDate,
} = require('../helpers/helpers.js');

router.post('/', async (req, res) => {
  const { itemId, amount, date, profileId } = req.body;
  if (!itemId || !amount || !date || !profileId) {
    return res
      .status(400)
      .json({ error: 'Wymagane pola to: itemId, amount, date, profileId.' });
  }
  if (!validateId(profileId)) {
    return res
      .status(400)
      .json({ error: 'ID profilu zawiera niepoprawne dane.' });
  }
  if (!validateId(itemId)) {
    return res
      .status(400)
      .json({ error: 'ID wydatku zawiera niepoprawne dane.' });
  }
  if (!validateAmount(amount)) {
    return res.status(400).json({ error: 'Kwota zawiera niepoprawne dane.' });
  }
  if (!validateDate(date)) {
    return res
      .status(400)
      .json({ error: 'Data zawiera niepoprawne dane lub jest w przyszłości.' });
  }
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkItemExists(itemId, profileId))) {
      return res
        .status(404)
        .json({ message: 'Pozycja o podanym ID nie istnieje w tym profilu.' });
    }
    const sql =
      'INSERT INTO expenses (fk_item, amount, date, fk_profile) VALUES (?, ?, ?, ?)';
    const values = [itemId, amount, date, profileId];
    const insertResult = await db.runPromise(sql, values);
    return res.status(201).json({
      expenseId: insertResult.lastID,
      message: 'Wydatek dodany pomyślnie!',
    });
  } catch (err) {
    // if (err.message.includes('FOREIGN KEY constraint failed')) {
    //   return res.status(400).json({ error: 'Podane ID pozycji nie istnieje.' });
    // }
    // if (err.message.includes('CHECK constraint failed')) {
    //   return res.status(400).json({ error: 'Kwota musi być większa niż 0, a data nie może być w przyszłości.' });
    // }
    // if (err.message.includes('datatype mismatch')) {
    //   return res.status(400).json({ error: 'Nieprawidłowy format daty. Użyj RRRR-MM-DD.' });
    // }
    // if (err.message.includes('NOT NULL constraint failed')) {
    //   return res.status(400).json({ error: 'Wszystkie pola (fk_item, amount, date, fk_profile) są wymagane.' });
    // }
    // if (err.message.includes('UNIQUE constraint failed')) {
    //   return res.status(409).json({ error: 'Taki wydatek już istnieje.' });
    // }
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const profileId = req.query.profileId;
  if (!profileId) {
    return res.status(400).json({ error: 'ID profilu jest wymagane.' });
  }
  if (!validateId(profileId)) {
    return res
      .status(400)
      .json({ error: 'ID profilu zawiera niepoprawne dane.' });
  }
  const sql = `
    SELECT
      e.id_expense,
      e.amount,
      e.date,
      i.name AS item_name,
      c.name AS category_name,
      GROUP_CONCAT(l.name) AS labels
    FROM
      expenses e
    JOIN
      items i ON e.fk_item = i.id_item
    JOIN
      item_category ic ON i.id_item = ic.fk_item
    JOIN
      category c ON ic.fk_category = c.id_category
    LEFT JOIN
      item_label il ON i.id_item = il.fk_item
    LEFT JOIN
      labels l ON il.fk_label = l.id_label
    GROUP BY
      e.id_expense
    ORDER BY
      e.date DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

router.get('/:expenseId', (req, res) => {
  const expenseId = req.params.expenseId;
  const sql = `
    SELECT
      e.id_expense,
      e.amount,
      e.date,
      i.id_item AS fk_item,
      i.name AS item_name,
      c.id_category AS fk_category,
      c.name AS category_name,
      GROUP_CONCAT(l.name) AS labels,
      GROUP_CONCAT(l.id_label) AS label_ids
    FROM
      expenses e
    JOIN
      items i ON e.fk_item = i.id_item
    JOIN
      item_category ic ON i.id_item = ic.fk_item
    JOIN
      category c ON ic.fk_category = c.id_category
    LEFT JOIN
      item_label il ON i.id_item = il.fk_item
    LEFT JOIN
      labels l ON il.fk_label = l.id_label
    WHERE
      e.id_expense = ?
    GROUP BY
      e.id_expense
  `;

  db.get(sql, [expenseId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res
        .status(404)
        .json({ message: 'Wydatek o podanym ID nie istnieje.' });
    }
    res.json(row);
  });
});

router.delete('/:expenseId', (req, res) => {
  const expenseId = req.params.expenseId;
  const sql = 'DELETE FROM expenses WHERE id_expense = ?';

  db.run(sql, [expenseId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ message: 'Wydatek o podanym ID nie istnieje.' });
    }
    res.json({ message: 'Wydatek usunięty pomyślnie.' });
  });
});

router.put('/:expenseId', (req, res) => {
  const expenseId = req.params.expenseId;
  const { itemId, amount, date } = req.body;

  if (!itemId || !amount || !date) {
    return res
      .status(400)
      .json({ error: 'Wszystkie pola (fk_item, amount, date) są wymagane.' });
  }

  const sql = `
    UPDATE expenses
    SET fk_item = ?,
        amount = ?,
        date = ?
    WHERE id_expense = ?
  `;
  const values = [itemId, amount, date, expenseId];

  db.run(sql, values, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({
        message: 'Wydatek o podanym ID nie istnieje lub nie zmieniono danych.',
      });
    }
    res.json({ message: 'Wydatek zaktualizowany pomyślnie.' });
  });
});

module.exports = router;
