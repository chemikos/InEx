const express = require('express');
const router = express.Router();
const db = require('../database.js');
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
  parseAmountToCents,
} = require('../helpers/helpers.js');

router.post('/', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.sourceId,
      field: 'id',
      type: 'source',
    },
    {
      value: req.body.amount,
      field: 'amount',
      type: null,
    },
    {
      value: req.body.date,
      field: 'date',
      type: 'income',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const { profileId, sourceId, date } = req.body;
  const amount = parseAmountToCents(req.body.amount);
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkSourceExists(sourceId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Typ dochodu o podanym ID nie istnieje w tym profilu.',
      });
    }
    const sql = 'INSERT INTO incomes (fk_source, amount, date, fk_profile) VALUES (?, ?, ?, ?)';
    const values = [sourceId, amount, date, profileId];
    const insertResult = await db.runPromise(sql, values);
    await db.runPromise('COMMIT;');
    return res.status(201).json({
      sourceId: insertResult.lastID,
      message: 'Wpłata dodana pomyślnie!',
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
  const sourceIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.sourceId,
    'id',
    'source'
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
    let sql = `
        SELECT
            i.id_income,
            i.amount,
            i.date,
            s.name AS source_name,
            s.id_source,
            i.fk_profile`;
    let baseSQL = `
        FROM incomes i
        JOIN sources s ON i.fk_source = s.id_source
        WHERE 
            i.fk_profile = ?`;
    if (sourceIds.length > 0) {
      const placeholders = new Array(sourceIds.length).fill('?').join(', ');
      baseSQL += ` AND i.fk_source IN (${placeholders})`;
      params.push(...sourceIds);
    }
    if (dateFrom) {
      baseSQL += ` AND i.date >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      baseSQL += ` And i.date <= ?`;
      params.push(dateTo);
    }

    const countQuery = `SELECT COUNT(DISTINCT i.id_income) AS total ${baseSQL}`;
    const countResult = await db.getPromise(countQuery, params);
    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    sql += baseSQL;

    sql += ` 
      ORDER BY
        i.date DESC, s.name      
    LIMIT ? OFFSET ?`;
    params.push(limit);
    params.push(offset);

    const resultIncomes = await db.allPromise(sql, params);

    const totalIncomeAllTimeResult = await db.getPromise(
      `SELECT SUM(amount) AS total FROM incomes WHERE fk_profile = ?;`,
      [profileId]
    );
    const totalIncomeAllTime = totalIncomeAllTimeResult?.total || 0;

    const totalIncomeCurrentYearResult = await db.getPromise(
      `SELECT SUM(amount) AS total FROM incomes WHERE fk_profile = ? AND strftime('%Y', date) = strftime('%Y', 'now');`,
      [profileId]
    );
    const totalIncomeCurrentYear = totalIncomeCurrentYearResult?.total || 0;

    const totalIncomeCurrentMonthResult = await db.getPromise(
      `SELECT SUM(amount) AS total FROM incomes WHERE fk_profile = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now');`,
      [profileId]
    );
    const totalIncomeCurrentMonth = totalIncomeCurrentMonthResult?.total || 0;

    const totals = {
      AllTime: totalIncomeAllTime,
      CurrentYear: totalIncomeCurrentYear,
      CurrentMonth: totalIncomeCurrentMonth,
    };

    const aggregatedIncome = await db.allPromise(
      `SELECT s.name AS source_name, SUM(i.amount) AS total
       FROM incomes i
       LEFT JOIN sources s ON s.id_source = i.fk_source
       WHERE i.fk_profile = ?
       GROUP BY s.name
       ORDER BY s.name`,
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
      data: resultIncomes,
      aggregated: aggregatedIncome,
    });
  } catch (err) {
    console.error('[GET /incomes] Błąd serwera:', err);
    return res.status(500).json({ message: 'Wystąpił błąd serwera. Spróbuj ponownie później.' });
  }
});

router.get('/:incomeId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedValue(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.incomeId,
      field: 'id',
      type: 'income',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = validationParams[0].value;
  const incomeId = req.params.incomeId;
  try {
    if (!(await checkProfileExists(profileId))) {
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = `
          SELECT
            i.id_income,
            i.amount,
            i.date,
            i.fk_profile,
            s.id_source,
            s.name AS source_name
          FROM incomes i
          JOIN sources s ON i.fk_source = s.id_source
          WHERE
            i.id_income = ? AND i.fk_profile = ?
        `;
    const resultIncome = await db.getPromise(sql, [incomeId, profileId]);
    if (!resultIncome) {
      return res.status(404).json({
        message: 'Wpłata o podanym ID nie istnieje w tym profilu.',
      });
    }
    return res.status(200).json(resultIncome);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/:incomeId', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.sourceId,
      field: 'id',
      type: 'source',
    },
    {
      value: req.body.amount,
      field: 'amount',
      type: null,
    },
    {
      value: req.body.date,
      field: 'date',
      type: 'income',
    },
    {
      value: req.params.incomeId,
      field: 'id',
      type: 'income',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const { profileId, sourceId, date } = req.body;
  const amount = parseAmountToCents(req.body.amount);
  const incomeId = req.params.incomeId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkIncomeExists(incomeId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Wpłata o podanym ID nie istnieje.' });
    }
    if (!(await checkSourceExists(sourceId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Typ dochodu o podanym ID nie istnieje.' });
    }
    const sql =
      'UPDATE incomes SET amount = ?, date = ?, fk_source = ? WHERE id_income = ? AND fk_profile = ?';
    const params = [amount, date, sourceId, incomeId, profileId];
    const updateResult = await db.runPromise(sql, params);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Wpłata o podanym ID nie istnieje w danym profilu lub nie zmieniono danych.',
      });
    }
    await db.runPromise('COMMIT;');
    return res.status(200).json({ message: 'Wpłata zaktualizowana pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/:incomeId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedValue(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.incomeId,
      field: 'id',
      type: 'income',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = validationParams[0].value;
  const incomeId = req.params.incomeId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = 'DELETE FROM incomes WHERE id_income = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [incomeId, profileId]);
    if (deleteResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({ message: 'Wpłata o podanym ID nie istnieje w tym profilu.' });
    }
    await db.runPromise('COMMIT;');
    return res.status(200).json({ message: 'Wpłata usunięta pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
