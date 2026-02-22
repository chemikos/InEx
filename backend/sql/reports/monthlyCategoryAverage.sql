-- WITH months AS (
--   SELECT 
--     strftime('%Y-%m', date) AS month,
--     COUNT(*) AS days_in_month
--   FROM daily_summary
--   WHERE fk_profile = 1
--   GROUP BY month
-- ),
-- expenses_agg AS (
--   SELECT
--     c.id_category,
--     c.name AS category_name,
--     strftime('%Y-%m', e.date) AS month,
--     SUM(e.amount) AS month_total
--   FROM categories c
--   JOIN item_category ic ON c.id_category = ic.fk_category
--   JOIN expenses e ON ic.fk_item = e.fk_item
--   WHERE c.fk_profile = 1
--   GROUP BY c.id_category, month
-- )
-- SELECT
--   c.id_category,
--   c.name AS category_name,
--   m.month,
--   COALESCE(ea.month_total, 0) AS month_total,
--   CAST(COALESCE(ea.month_total, 0) * 1.0 / m.days_in_month AS INTEGER) AS monthly_category_average
-- FROM categories c
-- CROSS JOIN months m
-- LEFT JOIN expenses_agg ea
--   ON ea.id_category = c.id_category
--  AND ea.month = m.month
-- WHERE c.fk_profile = 1
-- ORDER BY m.month, c.name;


WITH months AS (
  SELECT 
    strftime('%Y-%m', date) AS month,
    COUNT(*) AS days_in_month
  FROM daily_summary
  WHERE fk_profile = ?
  GROUP BY month
),
expenses_agg AS (
  SELECT
    c.id_category,
    c.name AS category_name,
    strftime('%Y-%m', e.date) AS month,
    SUM(e.amount) AS month_total
  FROM categories c
  JOIN item_category ic ON c.id_category = ic.fk_category
  JOIN expenses e ON ic.fk_item = e.fk_item
  WHERE c.fk_profile = ?
  GROUP BY c.id_category, month
),
base AS (
  SELECT
    m.month AS period,
    c.name AS category_key,
    json_object(
      'id_category', c.id_category,
      'category_name', c.name,
      'month_total', COALESCE(ea.month_total, 0),
      'monthly_category_average',
        CAST(COALESCE(ea.month_total, 0) * 1.0 / m.days_in_month AS INTEGER)
    ) AS category_data
  FROM categories c
  CROSS JOIN months m
  LEFT JOIN expenses_agg ea
    ON ea.id_category = c.id_category
   AND ea.month = m.month
  WHERE c.fk_profile = ?
)
SELECT
  period,
  json_group_object(category_key, category_data) AS categories
FROM base
GROUP BY period
ORDER BY period;