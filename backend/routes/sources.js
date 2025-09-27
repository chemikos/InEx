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
  checkSourceNameExists,
  getValidationError,
  getNormalizedId,
} = require('../helpers/helpers.js');

router.post('/', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.sourceName,
      field: 'name',
      type: 'source',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const { profileId, sourceName } = req.body;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (await checkSourceNameExists(sourceName, profileId, null)) {
      await db.runPromise('ROLLBACK;');
      return res.status(409).json({
        error: 'Typ dochodu o tej nazwie już istnieje w tym profilu.',
      });
    }
    const sql = 'INSERT INTO sources (name, fk_profile) VALUES (?, ?)';
    const insertResult = await db.runPromise(sql, [sourceName, profileId]);
    await db.runPromise('COMMIT;');
    return res.status(201).json({
      sourceId: insertResult.lastID,
      message: 'Typ dochodu dodany pomyślnie!',
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
      'SELECT id_source, name, fk_profile FROM sources WHERE fk_profile = ? ORDER BY name';
    const resultSources = await db.allPromise(sql, [profileId]);
    return res.status(200).json(resultSources);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:sourceId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.sourceId,
      field: 'id',
      type: 'source',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const sourceId = req.params.sourceId;
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql =
      'SELECT id_source, name, fk_profile FROM sources WHERE id_source = ? AND fk_profile = ?';
    const resultSource = await db.getPromise(sql, [sourceId, profileId]);
    if (!resultSource) {
      return res.status(404).json({
        message: 'Typ dochodu o podanym ID nie istnieje w tym profilu.',
      });
    }
    return res.status(200).json(resultSource);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:sourceId', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.sourceName,
      field: 'name',
      type: 'source',
    },
    {
      value: req.params.sourceId,
      field: 'id',
      type: 'source',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = req.body.profileId;
  const sourceName = req.body.sourceName;
  const sourceId = req.params.sourceId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (await checkSourceNameExists(sourceName, profileId, sourceId)) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(409)
        .json({ error: 'Typ dochou o tej nazwie już istnieje w tym profilu.' });
    }
    sql = 'UPDATE sources SET name = ? WHERE id_source = ? AND fk_profile = ?';
    const updateResult = await db.runPromise(sql, [
      sourceName,
      sourceId,
      profileId,
    ]);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Typ dochodu o podanym ID nie istnieje w tym profilu.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Typ dochodu zaktualizowany pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:sourceId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.sourceId,
      field: 'id',
      type: 'source',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const sourceId = req.params.sourceId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    let sql =
      'SELECT COUNT(DISTINCT i.fk_source) AS count FROM incomes i WHERE i.fk_source = ? AND i.fk_profile = ?';
    const countResult = await db.getPromise(sql, [sourceId, profileId]);
    if (countResult.count > 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(409).json({
        message:
          'Nie można usunąć typu dochodu, ponieważ jest powiązany z co najmniej jedną wpłatą.',
      });
    }
    sql = 'DELETE FROM sources WHERE id_source = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [sourceId, profileId]);
    if (deleteResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Typ dochodu o podanym ID nie istnieje w tym profilu.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Typ dochodu został usunięty pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
