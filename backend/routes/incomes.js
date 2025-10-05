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
      type: null,
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const { profileId, sourceId, amount, date } = req.body;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkSourceExists(sourceId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Typ dochodu o podanym ID nie istnieje w tym profilu.',
      });
    }
    const sql =
      'INSERT INTO incomes (fk_source, amount, date, fk_profile) VALUES (?, ?, ?, ?)';
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
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
  ];
  const sourceIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.query.sourceId,
    'id',
    'source',
  );
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
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
    let sql = `
        SELECT
            i.id_income,
            i.amount,
            i.date,
            s.name AS source_name,
            s.id_source
        FROM incomes i
        JOIN sources s ON i.fk_source = s.id_source
        WHERE 
            i.date BETWEEN ? AND ? AND i.fk_profile = ?`;
    if (sourceIds.length > 0) {
      const placeholders = new Array(sourceIds.length).fill('?').join(', ');
      sql += ` AND i.fk_source IN (${placeholders})`;
      params.push(...sourceIds);
    }
    sql += ` 
      ORDER BY
        s.name, i.date`;
    const resultIncomes = await db.allPromise(sql, params);
    return res.status(200).json(resultIncomes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/:incomeId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
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
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const incomeId = req.params.incomeId;
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
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
      type: null,
    },
    {
      value: req.params.incomeId,
      field: 'id',
      type: 'income',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const { profileId, sourceId, amount, date } = req.body;
  const incomeId = req.params.incomeId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkIncomeExists(incomeId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Wpłata o podanym ID nie istnieje.' });
    }
    if (!(await checkSourceExists(sourceId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Typ dochodu o podanym ID nie istnieje.' });
    }
    const sql =
      'UPDATE incomes SET amount = ?, date = ?, fk_source = ? WHERE id_income = ? AND fk_profile = ?';
    const params = [amount, date, sourceId, incomeId, profileId];
    const updateResult = await db.runPromise(sql, params);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message:
          'Wpłata o podanym ID nie istnieje w danym profilu lub nie zmieniono danych.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Wpłata zaktualizowana pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/:incomeId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
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
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const incomeId = req.params.incomeId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = 'DELETE FROM incomes WHERE id_income = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [incomeId, profileId]);
    if (deleteResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Wpłata o podanym ID nie istnieje w tym profilu.' });
    }
    await db.runPromise('COMMIT;');
    return res.status(200).json({ message: 'Wpłata usunięta pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
