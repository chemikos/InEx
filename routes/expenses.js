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
      .json({ error: 'ID pozycji (itemId) zawiera niepoprawne dane.' });
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
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = `
      SELECT
        e.id_expense,
        e.amount,
        e.date,
        e.fk_profile,
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
      WHERE
        e.fk_profile = ?
      GROUP BY
        e.id_expense
      ORDER BY
        e.date DESC
    `;
    const resultExpenses = await db.allPromise(sql, [profileId]);
    return res.status(200).json(resultExpenses);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:expenseId', async (req, res) => {
  const profileId = req.query.profileId;
  const expenseId = req.params.expenseId;
  if (!profileId) {
    return res.status(400).json({ error: 'ID profilu jest wymagane.' });
  }
  if (!validateId(profileId)) {
    return res
      .status(400)
      .json({ error: 'ID profilu zawiera niepoprawne dane.' });
  }
  if (!validateId(expenseId)) {
    return res
      .status(400)
      .json({ error: 'ID wydatku zawiera niepoprawne dane.' });
  }
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = `
          SELECT
            e.id_expense,
            e.amount,
            e.date,
            e.fk_profile,
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
            e.id_expense = ? AND e.fk_profile = ?
          GROUP BY
            e.id_expense
        `;
    const resultExpense = await db.getPromise(sql, [categoryId, profileId]);
    if (!resultExpense) {
      return res.status(404).json({
        message: 'Wydatek o podanym ID nie istnieje w tym profilu.',
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:expenseId', async (req, res) => {
  const expenseId = req.params.expenseId;
  const { itemId, amount, date, profileId } = req.body;
  if (!itemId || !amount || !date || !profileId) {
    return res.status(400).json({
      error: 'Wszystkie pola (itemId, amount, date, profileId) są wymagane.',
    });
  }
  if (!validateId(profileId)) {
    return res
      .status(400)
      .json({ error: 'ID profilu (profileId) zawiera niepoprawne dane.' });
  }
  if (!validateId(expenseId)) {
    return res
      .status(400)
      .json({ error: 'ID wydatku (expenseId) zawiera niepoprawne dane.' });
  }
  if (!validateId(itemId)) {
    return res
      .status(400)
      .json({ error: 'ID pozycji (itemId) zawiera niepoprawne dane.' });
  }
  if (!validateAmount(amount)) {
    return res.status(400).json({ error: 'Kwota zawiera nie poprawne dane.' });
  }
  if (!validateDate(date)) {
    return res.status(400).json({
      error: 'Data zawiera niepoprawne dane lub jest w przyszłości. ',
    });
  }
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkExpenseExists(expenseId))) {
      return res
        .status(404)
        .json({ message: 'Wydatek (expenseId) o podanym ID nie istnieje.' });
    }
    if (!(await checkItemExists(itemId))) {
      return res
        .status(404)
        .json({ message: 'Pozycja (itemId) o podanym ID nie istnieje.' });
    }
    const sql =
      'UPDATE expenses SET amount = ?, date = ? WHERE id_expense = ? AND fk_item = ? AND fk_profile = ?';
    const values = [amount, date, expenseId, itemId, profileId];
    const updateResult = await db.runPromise(sql, values);
    if (updateResult.changes === 0) {
      return res.status(404).json({
        message:
          'Wydatek o podanym ID nie istnieje w danym profilu lub nie zmieniono danych.',
      });
    }
    return res.json({ message: 'Wydatek zaktualizowany pomyślnie.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:expenseId', async (req, res) => {
  const profileId = req.query.profileId;
  const expenseId = req.params.expenseId;
  if (!profileId) {
    return res.status(400).json({ error: 'ID profilu jest wymagane.' });
  }
  if (!validateId(profileId)) {
    return res
      .status(400)
      .json({ error: 'ID profilu zawiera niepoprawne dane.' });
  }
  if (!validateId(expenseId)) {
    return res
      .status(400)
      .json({ error: 'ID wydatku zawiera niepoprawne dane.' });
  }
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = 'DELETE FROM expenses WHERE id_expense = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [expenseId, profileId]);
    if (deleteResult.changes === 0) {
      return res
        .status(404)
        .json({ message: 'Wydatek o podanym ID nie istnieje w tym profilu.' });
    }
    return res.status(200).json({ message: 'Wydatek usunięty pomyślnie.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
