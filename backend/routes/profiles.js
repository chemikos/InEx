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
      value: req.body.profileName,
      field: 'name',
      type: 'profile',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileName = req.body.profileName;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (await checkProfileNameExists(profileName, null)) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(409)
        .json({ message: 'Profil o tej nazwie już istnieje.' });
    }
    const sql = 'INSERT INTO profiles (name) VALUES (?)';
    const insertResult = await db.runPromise(sql, [profileName]);
    await db.runPromise('COMMIT;');
    return res.status(201).json({
      profileId: insertResult.lastID,
      message: 'Profil dodany pomyślnie!',
    });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM profiles ORDER BY name';
    const resultProfiles = await db.allPromise(sql, []);
    return res.status(200).json(resultProfiles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/:profileId', async (req, res) => {
  const validationParams = [
    {
      value: req.params.profileId,
      field: 'id',
      type: 'profile',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = req.params.profileId;
  try {
    const sql = 'SELECT * FROM profiles WHERE id_profile = ?';
    const resultProfile = await db.getPromise(sql, [profileId]);
    if (!resultProfile) {
      return res.status(404).json({
        message: 'Profil o podanym ID nie istnieje.',
      });
    }
    return res.status(200).json(resultProfile);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/:profileId', async (req, res) => {
  const validationParams = [
    {
      value: req.params.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.profileName,
      field: 'name',
      type: 'profile',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = req.params.profileId;
  const profileName = req.body.profileName;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (await checkProfileNameExists(profileName, profileId)) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(409)
        .json({ message: 'Profil o tej nazwie już istnieje.' });
    }
    const sql = 'UPDATE profiles SET name = ? WHERE id_profile = ?';
    const updateResult = await db.runPromise(sql, [profileName, profileId]);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Profil zaktualizowany pomyślnie!' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/:profileId', async (req, res) => {
  const validationParams = [
    {
      value: req.params.profileId,
      field: 'id',
      type: 'profile',
    },
  ];
  for (const param of validationParams) {
    const message = getValidationError(param.value, param.field, param.type);
    if (message) {
      return res.status(400).json({ message });
    }
  }
  const profileId = req.params.profileId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sqls = [
      'SELECT COUNT(*) AS count FROM expenses WHERE fk_profile = ?',
      'SELECT COUNT(*) AS count FROM items WHERE fk_profile = ?',
      'SELECT COUNT(*) AS count FROM categories WHERE fk_profile = ?',
      'SELECT COUNT(*) AS count FROM labels WHERE fk_profile = ?',
    ];
    for (const sql of sqls) {
      if ((await db.getPromise(sql, [profileId])).count > 0) {
        await db.runPromise('ROLLBACK;');
        return res.status(409).json({
          message:
            'Nie można usunąć profilu, ponieważ istnieją powiązane z nim dane.',
        });
      }
    }
    const sql = 'DELETE FROM profiles WHERE id_profile = ?';
    await db.runPromise(sql, [profileId]);
    await db.runPromise('COMMIT;');
    return res.status(200).json({ message: 'Profil usunięty pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
