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
  getNormalizedValue,
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
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkItemExists(itemId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Pozycja o podanym ID nie istnieje w tym profilu.' });
    }
    const sql = 'INSERT INTO expenses (fk_item, amount, date, fk_profile) VALUES (?, ?, ?, ?)';
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
      value: getNormalizedValue(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.query.dateFrom || null,
      field: 'date',
      type: 'from',
    },
    {
      value: req.query.dateTo || null,
      field: 'date',
      type: 'to',
    },
  ];

  const labelIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.labelId,
    'id',
    'label'
  );

  const categoryIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.categoryId,
    'id',
    'category'
  );

  const itemIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.itemId,
    'id',
    'item'
  );

  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }

  const profileId = validationParams[0].value;
  const dateFrom = validationParams[1].value;
  const dateTo = validationParams[2].value;

  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    return res.status(400).json({ message: 'Data początkowa jest późniejsza niż data końcowa.' });
  }

  const limit = req.query.limit ? Number(req.query.limit) : 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ message: 'Limit zawiera niepoprawne dane.' });
  }

  const offset = req.query.offset ? Number(req.query.offset) : 0;
  if (!Number.isInteger(offset) || offset < 0) {
    return res.status(400).json({ message: 'Offset zawiera niepoprawne dane.' });
  }

  const page = Math.floor(offset / limit) + 1;

  try {
    if (!(await checkProfileExists(profileId))) {
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }

    const params = [profileId];
    const whereClauses = [];
    let sql = `
      SELECT
        e.id_expense,
        e.amount,
        e.date,
        c.name AS category_name,
        i.name AS item_name,
        i.id_item AS fk_item,
        c.id_category AS fk_category,
        e.fk_profile,
       GROUP_CONCAT(DISTINCT l.name) AS labels,
       GROUP_CONCAT(DISTINCT l.id_label) AS label_ids`;
    let baseSQL = `
      FROM expenses e
      JOIN items i ON e.fk_item = i.id_item
      JOIN item_category ic ON i.id_item = ic.fk_item
      JOIN categories c ON ic.fk_category = c.id_category
      LEFT JOIN item_label il ON i.id_item = il.fk_item
      LEFT JOIN labels l ON il.fk_label = l.id_label
      WHERE
       i.fk_profile = ?`;
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
      baseSQL += ` AND (${whereClauses.join(' OR ')})`;
    }
    if (itemIds.length > 0) {
      const placeholders = new Array(itemIds.length).fill('?').join(', ');
      baseSQL += ` AND i.id_item IN (${placeholders})`;
      params.push(...itemIds);
    }
    if (dateFrom) {
      baseSQL += ` AND e.date >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      baseSQL += ` AND e.date <= ?`;
      params.push(dateTo);
    }

    const countQuery = `SELECT COUNT(DISTINCT e.id_expense) AS total ${baseSQL}`;
    const countResult = await db.getPromise(countQuery, params);
    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    sql += baseSQL;

    sql += ` GROUP BY e.id_expense
      ORDER BY e.date DESC, c.name, i.name
      LIMIT ? OFFSET ?;`;
    params.push(limit);
    params.push(offset);

    const resultExpenses = await db.allPromise(sql, params);
    const processedExpenses = resultExpenses.map((expense) => {
      return {
        ...expense,
        // Konwersja stringa etykiet na tablicę stringów
        labels: expense.labels ? expense.labels.split(',') : [],

        // Konwersja stringa ID etykiet na tablicę liczb
        label_ids: expense.label_ids ? expense.label_ids.split(',').map((id) => parseInt(id)) : [],
      };
    });

    const totalExpenseAllTimeResult = await db.getPromise(
      `SELECT ROUND(SUM(amount), 2) AS total FROM expenses WHERE fk_profile = ?;`,
      [profileId]
    );
    const totalExpenseAllTime = totalExpenseAllTimeResult?.total || 0;
    const totalExpenseCurrentYearResult = await db.getPromise(
      `SELECT ROUND(SUM(amount), 2) AS total FROM expenses WHERE fk_profile = ? AND strftime('%Y', date) = strftime('%Y', 'now');`,
      [profileId]
    );
    const totalExpenseCurrentYear = totalExpenseCurrentYearResult?.total || 0;
    const totalExpenseCurrentMonthResult = await db.getPromise(
      `SELECT ROUND(SUM(amount), 2) AS total FROM expenses WHERE fk_profile = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now');`,
      [profileId]
    );
    const totalExpenseCurrentMonth = totalExpenseCurrentMonthResult?.total || 0;

    const totalIncomeAllTimeResult = await db.getPromise(
      `SELECT ROUND(SUM(amount), 2) AS total FROM incomes WHERE fk_profile = ?;`,
      [profileId]
    );
    const totalIncomeAllTime = totalIncomeAllTimeResult?.total || 0;

    const totalIncomeCurrentYearResult = await db.getPromise(
      `SELECT ROUND(SUM(amount), 2) AS total FROM incomes WHERE fk_profile = ? AND strftime('%Y', date) = strftime('%Y', 'now');`,
      [profileId]
    );
    const totalIncomeCurrentYear = totalIncomeCurrentYearResult?.total || 0;

    const totalIncomeCurrentMonthResult = await db.getPromise(
      `SELECT ROUND(SUM(amount), 2) AS total FROM incomes WHERE fk_profile = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now');`,
      [profileId]
    );
    const totalIncomeCurrentMonth = totalIncomeCurrentMonthResult?.total || 0;

    const totals = {
      expenses: {
        AllTime: totalExpenseAllTime,
        CurrentYear: totalExpenseCurrentYear,
        CurrentMonth: totalExpenseCurrentMonth,
      },
      incomes: {
        AllTime: totalIncomeAllTime,
        CurrentYear: totalIncomeCurrentYear,
        CurrentMonth: totalIncomeCurrentMonth,
      },
    };

    // const totals = {

    // };

    const aggregatedExpense = await db.allPromise(
      `SELECT i.name AS item_name, c.name AS category_name, ROUND(SUM(e.amount), 2) AS total
      FROM expenses e
      JOIN items i ON e.fk_item = i.id_item
      JOIN item_category ic ON i.id_item = ic.fk_item
      JOIN categories c ON ic.fk_category = c.id_category
      WHERE e.fk_profile = ?
      GROUP BY i.id_item, c.id_category
      ORDER BY total DESC`,
      [profileId]
    );

    const aggregatedExpenseByLabel = await db.allPromise(
      `SELECT l.name AS label_name, ROUND(SUM(e.amount), 2) AS total
      FROM expenses e
      JOIN items i ON e.fk_item = i.id_item
      LEFT JOIN item_label il ON i.id_item = il.fk_item
      LEFT JOIN labels l ON l.id_label = il.fk_label
      WHERE e.fk_profile = ?
      GROUP BY l.id_label
      ORDER BY total DESC`,
      [profileId]
    );

    const metadata = {
      totalCount,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      limit,
      offset,
      nextOffset: offset + limit < totalCount ? offset + limit : null,
      previousOffset: offset - limit >= 0 ? offset - limit : null,
    };

    return res.status(200).json({
      totals,
      metadata,
      data: processedExpenses,
      aggregated: {
        aggregatedExpense,
        aggregatedExpenseByLabel,
      },
    });
  } catch (err) {
    console.error('[GET /expenses] Błąd serwera:', err);
    return res.status(500).json({ message: 'Wystąpił błąd serwera. Spróbuj ponownie później.' });
  }
});

router.get('/:expenseId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedValue(req.query.profileId),
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
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
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
      type: 'expense',
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
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkExpenseExists(expenseId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Wydatek (expenseId) o podanym ID nie istnieje.' });
    }
    if (!(await checkItemExists(itemId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Pozycja (itemId) o podanym ID nie istnieje.' });
    }
    const sql =
      'UPDATE expenses SET amount = ?, date = ? WHERE id_expense = ? AND fk_item = ? AND fk_profile = ?';
    const values = [amount, date, expenseId, itemId, profileId];
    const updateResult = await db.runPromise(sql, values);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Wydatek o podanym ID nie istnieje w danym profilu lub nie zmieniono danych.',
      });
    }
    await db.runPromise('COMMIT;');
    return res.status(200).json({ message: 'Wydatek zaktualizowany pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/:expenseId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedValue(req.query.profileId),
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
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = 'DELETE FROM expenses WHERE id_expense = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [expenseId, profileId]);
    if (deleteResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Wydatek o podanym ID nie istnieje w tym profilu.' });
    }
    await db.runPromise('COMMIT;');
    return res.status(200).json({ message: 'Wydatek usunięty pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
