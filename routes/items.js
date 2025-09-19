const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/', (req, res) => {
  const { itemName, categoryId, labelIds } = req.body;
  if (!itemName || !categoryId) {
    return res
      .status(400)
      .json({ error: 'Nazwa pozycji i ID kategorii są wymagane.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    db.run('INSERT OR IGNORE INTO items (name) VALUES (?)', [itemName]);
    db.get(
      'SELECT id_item FROM items WHERE name = ?',
      [itemName],
      (err, row) => {
        if (err) {
          db.run('ROLLBACK;');
          return res.status(500).json({ error: err.message });
        }
        const itemId = row.id_item;

        // Sprawdź, czy powiązanie item_category już istnieje, a następnie dodaj
        db.get(
          'SELECT * FROM item_category WHERE fk_item = ? AND fk_category = ?',
          [itemId, categoryId],
          (err, existingLink) => {
            if (err) {
              db.run('ROLLBACK;');
              return res.status(500).json({ error: err.message });
            }
            if (!existingLink) {
              db.run(
                'INSERT INTO item_category (fk_item, fk_category) VALUES (?, ?)',
                [itemId, categoryId],
              );
            }

            // Dodaj powiązania z etykietami, jeśli podano
            if (labelIds && labelIds.length > 0) {
              labelIds.forEach((labelId) => {
                db.run(
                  'INSERT OR IGNORE INTO item_label (fk_item, fk_label) VALUES (?, ?)',
                  [itemId, labelId],
                );
              });
            }

            db.run('COMMIT;', (commitErr) => {
              if (commitErr) {
                return res.status(500).json({ error: commitErr.message });
              }
              res.status(201).json({
                itemId: itemId,
                message: 'Pozycja dodana i powiązana pomyślnie!',
              });
            });
          },
        );
      },
    );
  });
});

router.get('/', (req, res) => {
  const { categoryId, labelId } = req.query;
  let sql = `
    SELECT
      i.id_item,
      i.name
    FROM items i
  `;
  const params = [];

  if (categoryId) {
    sql += ` JOIN item_category ic ON i.id_item = ic.fk_item WHERE ic.fk_category = ?`;
    params.push(categoryId);
  } else if (labelId) {
    sql += ` JOIN item_label il ON i.id_item = il.fk_item WHERE il.fk_label = ?`;
    params.push(labelId);
  }

  sql += ` ORDER BY i.name`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

router.get('/:itemId', (req, res) => {
  const sql = `
  SELECT
    id_item,
    name
  FROM items
  WHERE id_item = ?
  `;

  const itemId = req.params.itemId;

  db.all(sql, [itemId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

router.put('/:itemId', (req, res) => {
  const { itemName, categoryId, labelIds } = req.body;
  const itemId = req.params.itemId;

  if (!itemName || !categoryId) {
    return res
      .status(400)
      .json({ error: 'Nazwa pozycji i ID kategorii są wymagane.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    // 1. Zaktualizuj nazwę pozycji, jeśli została zmieniona
    db.run(
      'UPDATE items SET name = ? WHERE id_item = ?',
      [itemName, itemId],
      function (err) {
        if (err) {
          db.run('ROLLBACK;');
          return res.status(500).json({ error: err.message });
        }
      },
    );

    // 2. Zaktualizuj powiązanie z kategorią, jeśli zostało zmienione
    db.run(
      'UPDATE item_category SET fk_category = ? WHERE fk_item = ?',
      [categoryId, itemId],
      function (err) {
        if (err) {
          db.run('ROLLBACK;');
          return res.status(500).json({ error: err.message });
        }
      },
    );

    // 3. Usuń wszystkie stare etykiety dla tej pozycji
    db.run(
      'DELETE FROM item_label WHERE fk_item = ?',
      [itemId],
      function (err) {
        if (err) {
          db.run('ROLLBACK;');
          return res.status(500).json({ error: err.message });
        }

        // 4. Dodaj nowe etykiety, jeśli zostały przekazane
        if (labelIds && labelIds.length > 0) {
          const promises = labelIds.map((labelId) => {
            return new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO item_label (fk_item, fk_label) VALUES (?, ?)',
                [itemId, labelId],
                (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                },
              );
            });
          });

          Promise.all(promises)
            .then(() => {
              db.run('COMMIT;', (commitErr) => {
                if (commitErr) {
                  return res.status(500).json({ error: commitErr.message });
                }
                res.json({
                  message:
                    'Pozycja, kategoria i etykiety zaktualizowane pomyślnie.',
                });
              });
            })
            .catch((error) => {
              db.run('ROLLBACK;');
              res.status(500).json({ error: error.message });
            });
        } else {
          // Zakończ transakcję, jeśli nie ma etykiet do dodania
          db.run('COMMIT;', (commitErr) => {
            if (commitErr) {
              return res.status(500).json({ error: commitErr.message });
            }
            res.json({
              message: 'Pozycja i kategoria zaktualizowane pomyślnie.',
            });
          });
        }
      },
    );
  });
});

router.delete('/:itemId', (req, res) => {
  const itemId = req.params.itemId;

  // Sprawdź, czy pozycja jest używana w tabeli expenses
  db.get(
    'SELECT COUNT(*) AS count FROM expenses WHERE fk_item = ?',
    [itemId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row.count > 0) {
        return res.status(409).json({
          message:
            'Nie można usunąć pozycji, ponieważ jest używana w rekordach wydatków.',
        });
      }

      // Jeśli nie ma powiązań, usuń powiązania z kategorii i etykiet, a następnie usuń pozycję
      db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        db.run('DELETE FROM item_category WHERE fk_item = ?', [itemId]);
        db.run('DELETE FROM item_label WHERE fk_item = ?', [itemId]);
        db.run('DELETE FROM items WHERE id_item = ?', [itemId], function (err) {
          if (err) {
            db.run('ROLLBACK;');
            return res.status(500).json({ error: err.message });
          }
          db.run('COMMIT;');
          if (this.changes === 0) {
            return res
              .status(404)
              .json({ message: 'Pozycja o podanym ID nie istnieje.' });
          }
          res.json({ message: 'Pozycja i jej powiązania usunięte pomyślnie.' });
        });
      });
    },
  );
});

module.exports = router;
