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
      value: req.body.categoryId,
      field: 'id',
      type: 'category',
    },
    {
      value: req.body.itemName,
      field: 'name',
      type: 'item',
    },
  ];
  const labelIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.body.labelIds,
    'id',
    'label',
  );
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const { itemName, categoryId, profileId } = req.body;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkCategoryExists(categoryId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Kategoria o podanym ID nie istnieje w tym profilu.',
      });
    }
    if (labelIds.length > 0) {
      for (const labelId of labelIds) {
        if (!(await checkLabelExists(labelId, profileId))) {
          await db.runPromise('ROLLBACK;');
          return res.status(400).json({
            error: `Etykieta o ID ${labelId} nie istnieje w tym profilu.`,
          });
        }
      }
    }
    let sql = 'INSERT OR IGNORE INTO items (name, fk_profile) VALUES (?, ?)';
    await db.runPromise(sql, [itemName, profileId]);
    sql = 'SELECT id_item FROM items WHERE name = ? AND fk_profile = ?';
    const itemResult = await db.getPromise(sql, [itemName, profileId]);
    const itemId = itemResult.id_item;
    sql =
      'INSERT OR IGNORE INTO item_category (fk_item, fk_category) VALUES (?, ?)';
    const insertItemCategoryResult = await db.runPromise(sql, [
      itemId,
      categoryId,
    ]);
    if (insertItemCategoryResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(409)
        .json({ error: 'Ta pozycja już ma przypisaną kategorię.' });
    }
    if (labelIds.length > 0) {
      for (const labelId of labelIds) {
        const insertLabelSQL =
          'INSERT OR IGNORE INTO item_label (fk_item, fk_label) VALUES (?, ?)';
        await db.runPromise(insertLabelSQL, [itemId, labelId]);
      }
    }
    await db.runPromise('COMMIT;');
    return res.status(201).json({
      itemId: itemId,
      message: 'Pozycja dodana i powiązana pomyślnie!',
    });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  // do zrobienia
  // NOT IN
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
    register.query.categoryId,
    'id',
    'category',
  );
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
    const params = [profileId];
    const whereClauses = [];
    let sql = 'SELECT DISTINCT i.id_item, i.name, i.fk_profile FROM items i';
    sql += ' LEFT JOIN item_category ic ON i.id_item = ic.fk_item';
    sql += ' LEFT JOIN item_label il ON i.id_item = il.fk_item';
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
      sql += ` WHERE i.fk_profile = ? AND (${whereClauses.join(' OR ')})`;
    } else {
      sql += ` WHERE i.fk_profile = ?`;
    }
    sql += ` ORDER BY i.name`;
    const resultItems = await db.allPromise(sql, params);
    return res.status(200).json({ message: resultItems });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:itemId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.itemId,
      field: 'id',
      type: 'item',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const itemId = req.params.itemId;
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql =
      'SELECT id_item, name, fk_profile FROM items WHERE id_item = ? AND fk_profile = ?';
    const resultItem = await db.getPromise(sql, [itemId, profileId]);
    return res.status(200).json({ message: resultItem });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:itemId', async (req, res) => {
  const validationParams = [
    {
      value: req.body.profileId,
      field: 'id',
      type: 'profile',
    },
    {
      value: req.body.categoryId,
      field: 'id',
      type: 'category',
    },
    {
      value: req.body.itemName,
      field: 'name',
      type: 'item',
    },
    {
      value: req.params.itemId,
      field: 'id',
      type: 'item',
    },
  ];
  const labelIds = getNormalizedValuesAndPushToParams(
    validationParams,
    req.body.labelIds,
    'id',
    'label',
  );
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const { itemName, categoryId, profileId } = req.body;
  const itemId = req.params.itemId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    if (!(await checkCategoryExists(categoryId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ error: 'Kategoria o podanym ID nie istnieje w tym profilu.' });
    }
    if (!(await checkItemExists(itemId, profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ error: 'Pozycja o podamnym ID nie istnieje w tym profilu.' });
    }
    if (labelIds.length > 0) {
      for (const labelId of labelIds) {
        if (!(await checkLabelExists(labelId, profileId))) {
          await db.runPromise('ROLLBACK;');
          return res.status(409).json({
            error: `Etykieta o tym ID (${labelId}) nie istnieje w tym profilu.`,
          });
        }
      }
    }
    if (await checkItemNameExists(itemName, profileId, itemId, categoryId)) {
      await db.runPromise('ROLLBACK;');
      return res.status(409).json({
        error:
          'Pozycja o tej nazwie już istnieje w tej kategorii w tym profilu.',
      });
    }
    let sql = 'UPDATE items SET name = ? WHERE id_item = ? AND fk_profile = ?';
    const updateNameResult = await db.runPromise(sql, [
      itemName,
      itemId,
      profileId,
    ]);
    if (updateNameResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ error: 'Pozycja o podanym ID nie istnieje w tym profilu.' });
    }
    sql = 'UPDATE item_category SET fk_category = ? WHERE fk_item = ?';
    const updateItemCategoryResult = await db.runPromise(sql, [
      categoryId,
      profileId,
    ]);
    if (updateItemCategoryResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        error: 'Pozycja o tym ID nie jest przypisana do żadnej kategorii.',
      });
    }
    sql = 'DELETE FROM item_label WHERE fk_item = ?';
    await db.runPromise(sql, [itemId]);
    if (labelIds.length > 0) {
      sql = 'INSERT INTO item_label (fk_item, fk_label) VALUES (?, ?)';
      for (const labelId of labelIds) {
        await db.runPromise(sql, [itemId, labelId]);
      }
    }
    await db.runPromise('COMMIT;');
    return res.status(200).json({
      message: 'Pozycja, kategoria i etykiety zaktualizowane pomyślnie.',
    });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:itemId', async (req, res) => {
  const validationParams = [
    {
      value: getNormalizedId(req.query.profileId),
      field: 'id',
      type: 'profile',
    },
    {
      value: req.params.itemId,
      field: 'id',
      type: 'item',
    },
  ];
  for (const param of validationParams) {
    const error = getValidationError(param.value, param.field, param.type);
    if (error) {
      return res.status(400).json({ error });
    }
  }
  const profileId = validationParams[0].value;
  const itemId = req.params.itemId;
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    let sql =
      'SELECT COUNT(*) AS count FROM expenses WHERE fk_item = ? AND fk_profile = ?';
    const countResult = await db.getPromise(sql, [itemId, profileId]);
    if (countResult.count > 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(409).json({
        message:
          'Nie można usunąć pozycji, ponieważ jest powiązana z co najmniej jednym wydatkiem.',
      });
    }
    sql = 'DELETE FROM item_category WHERE fk_item = ?';
    await db.runPromise(sql, [itemId]);
    sql = 'DELETE FROM item_label WHERE fk_item = ?';
    await db.runPromise(sql, [itemId]);
    sql = 'DELETE FROM items WHERE id_item = ? AND fk_profile = ?';
    await db.runPromise(sql, [itemId, profileId]);
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Pozycja i jej powiązania usunięte pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
