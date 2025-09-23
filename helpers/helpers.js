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
    'SELECT * FROM categories WHERE id_category = ? AND fk_profile = ?',
    [categoryId, profileId],
  );
  return !!categoryExists;
}

async function checkLabelExists(labelId, profileId) {
  const labelExists = await db.getPromise(
    'SELECT * FROM labels WHERE id_label = ? AND fk_profile = ?',
    [labelId, profileId],
  );
  return !!labelExists;
}

async function checkExpenseExists(expenseId, profileId) {
  const expenseExists = await db.getPromise(
    'SELECT * FROM expenses WHERE id_expense = ? AND fk_profile = ?',
    [expenseId, profileId],
  );
  return !!expenseExists;
}

async function checkCategoryNameExists(categoryName, profileId, categoryId) {
  let categoryNameExists = false;
  if (categoryId) {
    categoryNameExists = await db.getPromise(
      'SELECT * FROM categories WHERE name = ? AND fk_profile = ? AND id_category != ?',
      [categoryName, profileId, categoryId],
    );
  } else {
    categoryNameExists = await db.getPromise(
      'SELECT * FROM categories WHERE name = ? AND fk_profile = ?',
      [categoryName, profileId],
    );
  }
  return !!categoryNameExists;
}

async function checkItemNameExists(itemName, profileId, itemId, categoryId) {
  const itemNameExists = await db.getPromise(
    `SELECT * FROM items i
      JOIN item_category ic ON ic.fk_item = i.id_item
      WHERE i.name = ? AND i.fk_profile = ? AND i.id_item != ? AND id_category = ?`,
    [itemName, profileId, itemId, categoryId],
  );
  return !!itemNameExists;
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

function getErrorIfIdInvalid(id, id_type) {
  const idTypes = {
    category: 'kategorii',
    expense: 'wydatku',
    item: 'pozycji',
    label: 'etykiety',
    profile: 'profilu',
  };
  const idType = idTypes[id_type];
  if (!idType) {
    return 'Podany typ ID nie jest poprawny.';
  }
  if (!id) {
    return `ID ${idType} jest wymagany.`;
  }
  if (!validateId(id)) {
    return `ID ${idType} zawiera niepoprawne dane.`;
  }
  return null;
}

function getErrorIfNameInvalid(name, name_type) {
  const nameTypes = {
    category: 'kategorii',
    expense: 'wydatku',
    item: 'pozycji',
    label: 'etykiety',
    profile: 'profilu',
  };
  const nameType = nameTypes[name_type];
  if (!nameType) {
    return 'Podany typ nazwy nie jest poprawny.';
  }
  if (!name) {
    return `Nazwa ${nameType} jest wymagany.`;
  }
  if (!validateName(name)) {
    return `Nazwa ${nameType} zawiera niepoprawne dane.`;
  }
  return null;
}

function getErrorIfAmountInvalid(amount) {
  if (!amount) {
    return 'Kwota jest wymagana.';
  }
  if (!validateAmount(amount)) {
    return 'Kwota zawiera niepoprawne dane.';
  }
  return null;
}

function getErrorIfDateInvalid(date) {
  if (!date) {
    return 'Data jest wymagana.';
  }
  if (!validateDate(date)) {
    return 'Data zawiera niepoprawne dane lub jest w przyszłości.';
  }
  return null;
}

function getValidationError(value, field, type) {
  let error = 'null';
  switch (field) {
    case 'id':
      error = getErrorIfIdInvalid(value, type);
      break;
    case 'name':
      error = getErrorIfNameInvalid(value, type);
      break;
    case 'amount':
      error = getErrorIfAmountInvalid(value);
      break;
    case 'date':
      error = getErrorIfDateInvalid(value);
      break;
    default:
      return 'Podany typ pola jest niepoprawny.';
  }
  return error;
}

function getNormalizedId(rawId) {
  return Array.isArray(rawId) ? rawId[0] : rawId;
}

function getNormalizedValuesAndPushToParams(params, values, field, type) {
  const normalizedValues = [...new Set(values || [])];
  if (normalizedValues.length > 0) {
    for (const value of normalizedValues) {
      params.push({ value: value, field: field, type: type });
    }
  }
  return normalizedValues;
}

module.exports = {
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
};
