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
  getErrorIfIdInvalid,
  getErrorIfNameInvalid,
} = require('../helpers/helpers.js');

router.post('/', async (req, res) => {
  const profileId = req.body.profileId;
  const profileIdError = getErrorIfIdInvalid(profileId, 'profile');
  if (profileIdError) {
    return res.status(400).json({ error: profileIdError });
  }
  const categoryName = req.body.categoryName;
  const categoryNameError = getErrorIfNameInvalid(categoryName, 'category');
  if (categoryNameError) {
    return res.status(400).json({ error: categoryNameError });
  }
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql = 'INSERT INTO categories (name, fk_profile) VALUES (?,?)';
    const insertResult = await db.runPromise(sql, [categoryName, profileId]);
    await db.runPromise('COMMIT;');
    return res.status(201).json({
      categoryId: insertResult.lastID,
      message: 'Kategoria dodana pomyślnie!',
    });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    if (err.message.includes('UNIQUE constraint failed')) {
      return res
        .status(409)
        .json({ error: 'Kategoria o tej nazwie już istnieje w tym profilu.' });
    }
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const rawProfileId = req.query.profileId;
  const profileId = Array.isArray(rawProfileId)
    ? rawProfileId[0]
    : rawProfileId;
  const profileIdError = getErrorIfIdInvalid(profileId, 'profile');
  if (profileIdError) {
    return res.status(400).json({ error: profileIdError });
  }
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql =
      'SELECT id_category, name, fk_profile FROM categories WHERE fk_profile = ? ORDER BY name';
    const resultCategories = await db.allPromise(sql, [profileId]);
    return res.status(200).json(resultCategories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:categoryId', async (req, res) => {
  const rawProfileId = req.query.profileId;
  const profileId = Array.isArray(rawProfileId)
    ? rawProfileId[0]
    : rawProfileId;
  const profileIdError = getErrorIfIdInvalid(profileId, 'profile');
  if (profileIdError) {
    return res.status(400).json({ error: profileIdError });
  }
  const categoryId = req.params.categoryId;
  const categoryIdError = getErrorIfIdInvalid(categoryId, 'category');
  if (categoryIdError) {
    return res.status(400).json({ error: categoryIdError });
  }
  try {
    if (!(await checkProfileExists(profileId))) {
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    const sql =
      'SELECT id_category, name, fk_profile FROM categories WHERE id_category = ? AND fk_profile = ?';
    const resultCategory = await db.getPromise(sql, [categoryId, profileId]);
    if (!resultCategory) {
      return res.status(404).json({
        message: 'Kategoria o podanym ID nie istnieje w tym profilu.',
      });
    }
    return res.status(200).json(resultCategory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:categoryId', async (req, res) => {
  const profileId = req.body.profileId;
  const profileIdError = getErrorIfIdInvalid(profileId, 'profile');
  if (profileIdError) {
    return res.status(400).json({ error: profileIdError });
  }
  const categoryName = req.body.categoryName;
  const categoryNameError = getErrorIfNameInvalid(categoryName, 'category');
  if (categoryNameError) {
    return res.status(400).json({ error: categoryNameError });
  }
  const categoryId = req.params.categoryId;
  const categoryIdError = getErrorIfIdInvalid(categoryId, 'category');
  if (categoryIdError) {
    return res.status(400).json({ error: categoryIdError });
  }
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    let sql =
      'SELECT * FROM categories WHERE name = ? AND fk_profile = ? AND id_category != ?';
    const existingCategory = await db.getPromise(sql, [
      categoryName,
      profileId,
      categoryId,
    ]);
    if (existingCategory) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(409)
        .json({ error: 'Kategoria o tej nazwie już istnieje w tym profilu.' });
    }
    sql =
      'UPDATE categories SET name = ? WHERE id_category = ? AND fk_profile = ?';
    const updateResult = await db.runPromise(sql, [
      categoryName,
      categoryId,
      profileId,
    ]);
    if (updateResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Kategoria o podanym ID nie istnieje w tym profilu.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Kategoria zaktualizowana pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:categoryId', async (req, res) => {
  const rawProfileId = req.query.profileId;
  const profileId = Array.isArray(rawProfileId)
    ? rawProfileId[0]
    : rawProfileId;
  const profileIdError = getErrorIfIdInvalid(profileId, 'profile');
  if (profileIdError) {
    return res.status(400).json({ error: profileIdError });
  }
  const categoryId = req.params.categoryId;
  const categoryIdError = getErrorIfIdInvalid(categoryId, 'category');
  if (categoryIdError) {
    return res.status(400).json({ error: categoryIdError });
  }
  try {
    await db.runPromise('BEGIN TRANSACTION;');
    if (!(await checkProfileExists(profileId))) {
      await db.runPromise('ROLLBACK;');
      return res
        .status(404)
        .json({ message: 'Profil o podanym ID nie istnieje.' });
    }
    let sql =
      'SELECT COUNT(DISTINCT ic.fk_item) AS count FROM item_category ic JOIN items i ON ic.fk_item = i.id_item WHERE ic.fk_category = ? AND i.fk_profile = ?';
    const countResult = await db.getPromise(sql, [categoryId, profileId]);
    if (countResult.count > 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(409).json({
        message:
          'Nie można usunąć kategorii, ponieważ jest powiązana z co najmniej jedną pozycją wydatku.',
      });
    }
    sql = 'DELETE FROM categories WHERE id_category = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [categoryId, profileId]);
    if (deleteResult.changes === 0) {
      await db.runPromise('ROLLBACK;');
      return res.status(404).json({
        message: 'Kategoria o podanym ID nie istnieje w tym profilu.',
      });
    }
    await db.runPromise('COMMIT;');
    return res
      .status(200)
      .json({ message: 'Kategoria została usunięta pomyślnie.' });
  } catch (err) {
    await db.runPromise('ROLLBACK;');
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
