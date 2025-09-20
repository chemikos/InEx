const util = require('util');
const db = require('./database');

db.getPromise = util.promisify(db.get);
db.allPromise = util.promisify(db.all);

async function checkProfileExists(profileId) {
  const profileExists = await db.getPromise(
    'SELECT * FROM profiles WHERE id_profile = ?',
    [profileId],
  );
  return !!profileExists;
}

async function checkItemExists(itemId, profileId) {
  const itemExists = await db.getPromise(
    'SELECT * FROM items WHERE id_item = ? AND fk_profile = ?',
    [itemId, profileId],
  );
  return !!itemExists;
}

async function checkCategoryExists(categoryId, profileId) {
  const categoryExists = await db.getPromise(
    'SELECT * FROM category WHERE id_category = ? AND fk_profile = ?',
    [categoryId, profileId],
  );
  return !!categoryExists;
}

async function checkLabelExists(labelId, profileId) {
  const labelExists = await db.getPromise(
    'SELECT * FROM category WHERE id_category = ? AND fk_profile = ?',
    [labelId, profileId],
  );
  return !!labelExists;
}

function validateId(id) {
  const parsedId = Number(id);
  return (
    typeof parsedId === 'number' &&
    !isNaN(parsedId) &&
    Number.isInteger(parsedId) &&
    parsedId > 0
  );
}

function validateName(name) {
  return typeof name === 'string' && name.trim().length > 0;
}

function validateAmount(amount) {
  const parsedAmount = Number(amount);
  if (
    typeof parsedAmount !== 'number' ||
    isNaN(parsedAmount) ||
    parsedAmount <= 0
  ) {
    return false;
  }
  const isDecimalValid = Number.isInteger(parsedAmount * 100);
  return isDecimalValid;
}

function validateDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(d) && d.toISOString().slice(0, 10) === date && d <= today;
}

function validateCollectionOf(collection, field_type) {
  const validators = {
    id: validateId,
    name: validateName,
    amount: validateAmount,
    date: validateDate,
  };
  if (!Array.isArray(collection) || collection.length === 0) {
    return false;
  }
  const validator = validators[field_type];
  if (!validator) {
    return false;
  }
  for (const entry of collection) {
    if (!validator(entry)) {
      return false;
    }
  }
  return true;
}

module.exports = {
  checkProfileExists,
  checkItemExists,
  checkCategoryExists,
  checkLabelExists,
  validateId,
  validateName,
  validateAmount,
  validateDate,
  validateCollectionOf,
};
