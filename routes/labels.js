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
  checkCategoryNameExists,
  checkItemNameExists,
  checkLabelNameExists,
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
      value: req.body.labelName,
      field: 'name',
      type: 'label',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const { profileId, labelName } = req.body;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (await checkLabelNameExists(labelName, profileId, null)) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(409)
        .json({ error: 'Etykieta o tej nazwie już istnieje w tym profilu.' });
    }
    const sql = 'INSERT INTO labels (name, fk_profile) VALUES (?, ?)';
    const insertResult = await db.runPromise(sql, [labelName, profileId]);
    await db.runPromise('COMMIT;');
    return res.status(201).json({
      labelId: insertResult.lastID,
      message: 'Etykieta dodana pomyślnie!',
    });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
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
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql =
      'SELECT id_label, name, fk_profile FROM labels WHERE fk_profile = ? ORDER BY name';
    const resultLabels = await db.allPromise(sql, [profileId]);
    return res.status(200).json(resultLabels);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:labelId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.labelId,
      field: 'id',
      type: 'label',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const labelId = req.params.labelId;
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql =
      'SELECT id_label, name, fk_profile FROM labels WHERE id_label = ? AND fk_profile = ?';
    const resultLabel = await db.getPromise(sql, [labelId, profileId]);
    if (!resultLabel) {
      return res.status(404).json({
        message: 'Etykieta o podanym ID nie istnieje w tym profilu.',
      });
    }
    return res.status(200).json(resultLabel);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:labelId', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.labelName,
      field: 'name',
      type: 'label',
    },
    {
      value: req.params.labelId,
      field: 'id',
      type: 'label',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const { profileId, labelName } = req.body;
  const labelId = req.params.labelId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (await checkLabelNameExists(labelName, profileId, labelId)) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(409)
        .json({ error: 'Etykieta o tej nazwie już istnieje w tym profilu.' });
    }
    sql = 'UPDATE labels SET name = ? WHERE id_label = ? AND fk_profile = ?';
    const updateResult = await db.runPromise(sql, [
      labelName,
      labelId,
      profileId,
    ]);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Etykieta o podanym ID nie istnieje w tym profilu.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Etykieta zaktualizowana pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:labelId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.labelId,
      field: 'id',
      type: 'label',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const labelId = req.params.labelId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    let sql =
      'SELECT COUNT(DISTINCT il.fk_item) AS count FROM item_label il JOIN labels l ON il.fk_label = l.id_label WHERE il.fk_label = ? AND l.fk_profile = ?';
    const countResult = await db.getPromise(sql, [labelId, profileId]);
    if (countResult.count > 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(409).json({
        message:
          'Nie można usunąć etykiety, ponieważ jest powiązana z co najmniej jedną pozycją wydatku.',
      });
    }
    sql = 'DELETE FROM labels WHERE id_label = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [labelId, profileId]);
    if (deleteResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Etykieta o podanym ID nie istnieje w tym profilu.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Etykieta została usunięta pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
