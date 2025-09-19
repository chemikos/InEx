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
  validateId,
  validateName,
} = require('../helpers/helpers.js');

router.post('/', async (req, res) => {
  const { categoryName, profileId } = req.body;
  if (!categoryName || !profileId) {
    return res
      .status(400)
      .json({ error: 'Nazwa kategorii i ID profilu są wymagane.' });
  }
  if (!validateName(categoryName)) {
    return res
      .status(400)
      .json({ error: 'Nazwa kategorii zawiera niepoprawne dane.' });
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
    const sql = 'INSERT INTO category (name, fk_profile) VALUES (?,?)';
    const insertResult = await db.runPromise(sql, [categoryName, profileId]);
    return res
      .status(201)
      .json({
        categoryId: insertResult.lastID,
        message: 'Kategoria dodana pomyślnie!',
      });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res
        .status(409)
        .json({ error: 'Kategoria o tej nazwie już istnieje w tym profilu.' });
    }
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
    const sql =
      'SELECT id_category, name, fk_profile FROM category WHERE fk_profile = ? ORDER BY name';
    const resultCategories = await db.allPromise(sql, [profileId]);
    return res.status(200).json(resultCategories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:categoryId', async (req, res) => {
  const profileId = req.query.profileId;
  const categoryId = req.params.categoryId;
  if (!profileId) {
    return res.status(400).json({ error: 'ID profilu jest wymagane.' });
  }
  if (!validateId(categoryId)) {
    return res
      .status(400)
      .json({ error: 'ID kategorii zawiera niepoprawne dane.' });
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
    const sql =
      'SELECT id_category, name, fk_profile FROM category WHERE id_category = ? AND fk_profile = ?';
    const resultCategory = await db.getPromise(sql, [categoryId, profileId]);
    if (!resultCategory) {
      return res
        .status(404)
        .json({
          message: 'Kategoria o podanym ID nie istnieje w tym profilu.',
        });
    }
    return res.status(200).json(resultCategory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:categoryId', async (req, res) => {
  const profileId = req.query.profileId;
  const categoryName = req.body.categoryName;
  const categoryId = req.params.categoryId;
  if (!profileId || !categoryName) {
    return res
      .status(400)
      .json({ error: 'Nazwa kategorii oraz ID profilu są wymagane.' });
  }
  if (!validateName(categoryName)) {
    return res
      .status(400)
      .json({ error: 'Nazwa kategorii zawiera niepoprawne dane.' });
  }
  if (!validateId(categoryId)) {
    return res
      .status(400)
      .json({ error: 'ID kategorii zawiera niepoprawne dane.' });
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
    let sql =
      'SELECT * FROM category WHERE name = ? AND fk_profile = ? AND id_category != ?';
    const existingCategory = await db.getPromise(sql, [
      categoryName,
      profileId,
      categoryId,
    ]);
    if (existingCategory) {
      return res
        .status(409)
        .json({ error: 'Kategoria o tej nazwie już istnieje w tym profilu.' });
    }
    sql =
      'UPDATE category SET name = ? WHERE id_category = ? AND fk_profile = ?';
    const updateResult = await db.runPromise(sql, [
      categoryName,
      categoryId,
      profileId,
    ]);
    if (updateResult.changes === 0) {
      return res
        .status(404)
        .json({
          message: 'Kategoria o podanym ID nie istnieje w tym profilu.',
        });
    }
    return res
      .status(200)
      .json({ message: 'Kategoria zaktualizowana pomyślnie.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:categoryId', async (req, res) => {
  const profileId = req.query.profileId;
  const categoryId = req.params.categoryId;
  if (!profileId) {
    return res.status(400).json({ error: 'ID profilu jest wymagane.' });
  }
  if (!validateId(categoryId)) {
    return res
      .status(400)
      .json({ error: 'ID kategorii zawiera niepoprawne dane.' });
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
    let sql =
      'SELECT COUNT(DISTINCT ic.fk_item) AS count FROM item_category ic JOIN items i ON ic.fk_item = i.id_item WHERE ic.fk_category = ? AND i.fk_profile = ?';
    const countResult = await db.getPromise(sql, [categoryId, profileId]);
    if (countResult.count > 0) {
      return res
        .status(409)
        .json({
          message:
            'Nie można usunąć kategorii, ponieważ jest powiązana z co najmniej jedną pozycją wydatku.',
        });
    }
    sql = 'DELETE FROM category WHERE id_category = ? AND fk_profile = ?';
    const deleteResult = await db.runPromise(sql, [categoryId, profileId]);
    if (deleteResult.changes === 0) {
      return res
        .status(404)
        .json({
          message: 'Kategoria o podanym ID nie istnieje w tym profilu.',
        });
    }
    return res
      .status(200)
      .json({ message: 'Kategoria została usunięta pomyślnie.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
