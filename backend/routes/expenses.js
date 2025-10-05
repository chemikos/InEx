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
  checkCategoryExists,
  checkLabelExists,
  checkExpenseExists,
  checkSourceExists,
  checkIncomeExists,
  checkCategoryNameExists,
  checkItemNameExists,
  checkLabelNameExists,
  checkProfileNameExists,
  checkSourceNameExists,
  validateId,
  validateName,
  validateAmount,
  validateDate,
  validateCollectionOf,
  getErrorIfIdInvalid,
  getErrorIfNameInvalid,
  getErrorIfAmountInvalid,
  getErrorIfDateInvalid,
  getValidationError,
  getNormalizedId,
  getNormalizedDate,
  getNormalizedValuesAndPushToParams,
} = require('../helpers/helpers.js');

router.post('/', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.itemId,
      field: 'id',
      type: 'item',
    },
    {
      value: req.body.amount,
      field: 'amount',
      type: null,
    },
    {
      value: req.body.date,
      field: 'date',
      type: null,
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const { profileId, itemId, amount, date } = req.body;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkItemExists(itemId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Pozycja o podanym ID nie istnieje w tym profilu.' });
    }
    const sql =
      'INSERT INTO expenses (fk_item, amount, date, fk_profile) VALUES (?, ?, ?, ?)';
    const values = [itemId, amount, date, profileId];
    const insertResult = await db.runPromise(sql, values);
    await db.runPromise('COMMIT;');
    return res.status(201).json({
      expenseId: insertResult.lastID,
      message: 'Wydatek dodany pomyślnie!',
    });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
  ];
  const labelIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.labelId,
    'id',
    'label',
  );
  const categoryIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.categoryId,
    'id',
    'category',
  );
  const itemIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.itemId,
    'id',
    'item',
  );
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = validationParams[0].value;
  const dateFrom = req.query.dateFrom || '2020-02-10';
  const dateTo = req.query.dateTo || new Date().toISOString().slice(0, 10);
  if (req.query.dateFrom && !validateDate(dateFrom)) {
    return res
      .status(400)
      .json({ message: 'Data początkowa zawiera niepoprawne dane.' });
  }
  if (req.query.dateTo && !validateDate(dateTo)) {
    return res
      .status(400)
      .json({ message: 'Data końcowa zawiera niepoprawne dane.' });
  }
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const params = [dateFrom, dateTo, profileId];
    const whereClauses = [];
    let sql = `
      SELECT 
        id_expense,
        e.amount,
        e.date,
        c.name AS category_name,
        i.name AS item_name,
        i.id_item AS fk_item,
        c.id_category AS fk_category,
       GROUP_CONCAT(l.name) AS labels,
       GROUP_CONCAT(l.id_label) AS label_ids
      FROM expenses e
      JOIN items i ON e.fk_item = i.id_item
      JOIN item_category ic ON i.id_item = ic.fk_item
      JOIN categories c ON ic.fk_category = c.id_category
      LEFT JOIN item_label il ON i.id_item = il.fk_item
      LEFT JOIN labels l ON il.fk_label = l.id_label
      WHERE 
       e.date BETWEEN ? AND ? AND i.fk_profile = ?`;
    if (categoryIds.length > 0) {
      const placeholders = new Array(categoryIds.length).fill('?').join(', ');
      whereClauses.push(`ic.fk_category IN (${placeholders})`);
      params.push(...categoryIds);
    }
    if (labelIds.length > 0) {
      const placeholders = new Array(labelIds.length).fill('?').join(', ');
      whereClauses.push(`il.fk_label IN (${placeholders})`);
      params.push(...labelIds);
    }
    if (whereClauses.length > 0) {
      sql += ` AND (${whereClauses.join(' OR ')})`;
    }
    if (itemIds.length > 0) {
      const placeholders = new Array(itemIds.length).fill('?').join(', ');
      sql += ` AND i.id_item IN (${placeholders})`;
      params.push(...itemIds);
    }
    sql += ` GROUP BY e.id_expense
      ORDER BY e.date, c.name, i.name`;
    const resultExpenses = await db.allPromise(sql, params);

    const processedExpenses = resultExpenses.map((expense) => {
      return {
        ...expense,
        // Konwersja stringa etykiet na tablicę stringów
        labels: expense.labels ? expense.labels.split(',') : [],

        // Konwersja stringa ID etykiet na tablicę liczb
        label_ids: expense.label_ids
          ? expense.label_ids.split(',').map((id) => parseInt(id))
          : [],
      };
    });

    return res.status(200).json(processedExpenses);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/:expenseId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.expenseId,
      field: 'id',
      type: 'expense',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = validationParams[0].value;
  const expenseId = req.params.expenseId;
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
          FROM expenses e
          JOIN items i ON e.fk_item = i.id_item
          JOIN item_category ic ON i.id_item = ic.fk_item
          JOIN categories c ON ic.fk_category = c.id_category
          LEFT JOIN item_label il ON i.id_item = il.fk_item
          LEFT JOIN labels l ON il.fk_label = l.id_label
          WHERE
            e.id_expense = ? AND e.fk_profile = ?
          GROUP BY
            e.id_expense
        `;
    const resultExpense = await db.getPromise(sql, [expenseId, profileId]);
    if (!resultExpense) {
      return res.status(404).json({
        message: 'Wydatek o podanym ID nie istnieje w tym profilu.',
      });
    }
    return res.status(200).json(resultExpense);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/:expenseId', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.itemId,
      field: 'id',
      type: 'item',
    },
    {
      value: req.body.amount,
      field: 'amount',
      type: null,
    },
    {
      value: req.body.date,
      field: 'date',
      type: null,
    },
    {
      value: req.params.expenseId,
      field: 'id',
      type: 'expense',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const { profileId, itemId, amount, date } = req.body;
  const expenseId = req.params.expenseId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkExpenseExists(expenseId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Wydatek (expenseId) o podanym ID nie istnieje.' });
    }
    if (!(await checkItemExists(itemId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Pozycja (itemId) o podanym ID nie istnieje.' });
    }
    const sql =
      'UPDATE expenses SET amount = ?, date = ? WHERE id_expense = ? AND fk_item = ? AND fk_profile = ?';
    const values = [amount, date, expenseId, itemId, profileId];
    const updateResult = await db.runPromise(sql, values);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message:
          'Wydatek o podanym ID nie istnieje w danym profilu lub nie zmieniono danych.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Wydatek zaktualizowany pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/:expenseId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.expenseId,
      field: 'id',
      type: 'expense',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = validationParams[0].value;
  const expenseId = req.params.expenseId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = 'DELETE FROM expenses WHERE id_expense = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [expenseId, profileId]);
    if (deleteResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Wydatek o podanym ID nie istnieje w tym profilu.' });
    }
    await db.runPromise('COMMIT;');
    return res.status(200).json({ message: 'Wydatek usunięty pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
