const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/', (req, res) => {
  const { labelName } = req.body;
  if (!labelName) {
    return res.status(400).json({ error: 'Nazwa etykiety jest wymagana.' });
  }

  const sql = 'INSERT INTO labels (name) VALUES (?)';
  db.run(sql, [labelName], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res
          .status(409)
          .json({ error: 'Etykieta o tej nazwie już istnieje.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res
      .status(201)
      .json({ labelId: this.lastID, message: 'Etykieta dodana pomyślnie!' });
  });
});

router.get('/', (req, res) => {
  const { itemId } = req.query;
  let sql = `
    SELECT
      l.id_label,
      l.name
    FROM labels l
  `;
  const params = [];

  if (itemId) {
    sql += ` JOIN item_label il ON l.id_label = il.fk_label WHERE il.fk_item = ?`;
    params.push(categoryId);
  }
  sql += ` ORDER BY l.name`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

router.get('/:labelId', (req, res) => {
  const sql = `
  SELECT
    id_label,
    name
  FROM labels
  WHERE id_label = ?
  `;

  const labelId = req.params.labelId;

  db.all(sql, [labelId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

router.put('/:labelId', (req, res) => {
  const { labelName } = req.body;
  if (!labelName) {
    return res.status(400).json({ error: 'Nazwa etykiety jest wymagana.' });
  }

  const labelId = req.params.labelId;
  db.run(
    'UPDATE labels SET name = ? WHERE id_label = ?',
    [labelName, labelId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ message: 'Etykieta o podanym ID nie istnieje.' });
      }
      res.json({ message: 'Etykieta zaktualizowana pomyślnie.' });
    },
  );
});

router.delete('/:labelId', (req, res) => {
  const labelId = req.params.labelId;

  // Sprawdź, czy etykieta jest używana
  db.get(
    'SELECT COUNT(*) AS count FROM item_label WHERE fk_label = ?',
    [labelId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row.count > 0) {
        return res
          .status(409)
          .json({
            message:
              'Nie można usunąć etykiety, ponieważ jest przypisana do co najmniej jednej pozycji wydatku.',
          });
      }

      // Jeśli nie ma powiązań, usuń etykietę
      db.run(
        'DELETE FROM labels WHERE id_label = ?',
        [labelId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (this.changes === 0) {
            return res
              .status(404)
              .json({ message: 'Etykieta o podanym ID nie istnieje.' });
          }
          res.json({ message: 'Etykieta usunięta pomyślnie.' });
        },
      );
    },
  );
});

module.exports = router;
