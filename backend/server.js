const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ') ?
      authHeader.split(' ')[1]
    : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      return res
        .status(401)
        .json({ error: 'Недействительный или истёкший токен (401)' });
    }
  }

  const fallbackId =
    req.query.user_id ||
    req.query.admin_id ||
    req.body?.user_id ||
    req.body?.admin_id;

  if (fallbackId) {
    req.user = { id: Number(fallbackId) };
    return next();
  }

  return res.status(401).json({
    error: 'Требуется авторизация (заголовок Authorization: Bearer <token>)',
  });
}

function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ') ?
      authHeader.split(' ')[1]
    : null;

  if (token) {
    req.user = jwt.verify(token, JWT_SECRET);
  } else {
    const fallbackId = req.query.user_id || req.body?.user_id;
    if (fallbackId) {
      req.user = { id: Number(fallbackId) };
    }
  }
  next();
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Ошибка пула PostgreSQL:', err);
});

app.get('/api/test', (_req, res) => {
  res.json({
    message: 'API магазина роутеров работает!',
    timestamp: new Date(),
  });
});

app.get('/api/test-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      message: 'Подключение к БД успешно!',
      current_time: result.rows[0].current_time,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name.trim()],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const { id } = req.params;
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { categories } = req.query;
    let query = `
      SELECT 
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.description,
        p.brand,
        p.wifi_standard,
        p.ports_speed,
        p.price,
        p.discount_percent,
        ROUND(p.price * (1 - p.discount_percent / 100.0), 2) AS final_price,
        p.stock_quantity,
        p.image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    const params = [];

    if (categories) {
      const categoryIds = categories
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter(Boolean);
      if (categoryIds.length > 0) {
        query += ` WHERE p.category_id = ANY($1::int[])`;
        params.push(categoryIds);
      }
    }

    query += ` ORDER BY p.id ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT p.*, c.name AS category_name, 
      ROUND(p.price * (1 - p.discount_percent / 100.0), 2) AS final_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const {
      category_id,
      name,
      description,
      brand,
      wifi_standard,
      ports_speed,
      price,
      discount_percent,
      stock_quantity,
      image_url,
    } = req.body;
    const result = await pool.query(
      `INSERT INTO products (category_id, name, description, brand, wifi_standard, ports_speed, price, discount_percent, stock_quantity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        category_id,
        name,
        description,
        brand,
        wifi_standard,
        ports_speed,
        price,
        discount_percent || 0,
        stock_quantity || 0,
        image_url,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      brand,
      wifi_standard,
      ports_speed,
      price,
      discount_percent,
      stock_quantity,
      image_url,
    } = req.body;
    const result = await pool.query(
      `UPDATE products 
      SET category_id = $1, name = $2, description = $3, brand = $4, wifi_standard = $5, 
      ports_speed = $6, price = $7, discount_percent = $8, stock_quantity = $9, image_url = $10
      WHERE id = $11 RETURNING *`,
      [
        category_id,
        name,
        description,
        brand,
        wifi_standard,
        ports_speed,
        price,
        discount_percent,
        stock_quantity,
        image_url,
        id,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cart', optionalAuthenticate, async (req, res) => {
  try {
    const user_id = req.user?.id || req.query.user_id;

    if (!user_id) {
      return res.json({
        items: [],
        totalCount: 0,
        totalAmount: 0,
      });
    }

    const result = await pool.query(
      `
      SELECT 
        MIN(ci.id) AS cart_item_id,
        SUM(ci.quantity)::int AS quantity,
        p.id AS product_id,
        p.name,
        p.price,
        p.discount_percent,
        ROUND(p.price * (1 - p.discount_percent / 100.0), 2) AS unit_final_price,
        ROUND(p.price * (1 - p.discount_percent / 100.0) * SUM(ci.quantity), 2) AS total_item_price,
        p.image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      GROUP BY p.id, p.name, p.price, p.discount_percent, p.image_url
      ORDER BY MIN(ci.id) ASC
      `,
      [user_id],
    );

    const items = result.rows;
    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.total_item_price),
      0,
    );
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      items,
      totalCount,
      totalAmount: Number(totalAmount.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart', optionalAuthenticate, async (req, res) => {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const { product_id, quantity = 1 } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: 'Необходимо авторизоваться' });
    }

    if (!product_id) {
      return res.status(400).json({ error: 'product_id обязателен' });
    }

    const existing = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2 ORDER BY id ASC',
      [user_id, product_id],
    );

    if (existing.rows.length > 0) {
      const primaryId = existing.rows[0].id;
      const totalQty =
        existing.rows.reduce((sum, r) => sum + r.quantity, 0) +
        Number(quantity);

      const updated = await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
        [totalQty, primaryId],
      );

      if (existing.rows.length > 1) {
        const extraIds = existing.rows.slice(1).map((r) => r.id);
        await pool.query('DELETE FROM cart_items WHERE id = ANY($1)', [
          extraIds,
        ]);
      }

      return res.json(updated.rows[0]);
    }

    const inserted = await pool.query(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [user_id, product_id, quantity],
    );
    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cart/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (Number(quantity) <= 0) {
      await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
      return res.json({ success: true, deleted: true });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Позиция не найдена' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cart/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
    res.json({ success: true, message: 'Товар удален из корзины' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Заполните email и пароль' });
    }

    const result = await pool.query(
      `
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        r.name AS role,
        c.code AS coupon_code,
        c.discount_percent AS coupon_discount
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN coupons c ON u.coupon_id = c.id
      WHERE u.email = $1 AND u.password = $2
      `,
      [email, password],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const token = generateToken(user);

    res.json({
      message: 'Успешная авторизация',
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: 'Пользователь с таким email уже существует' });
    }

    const roleQuery = await pool.query(
      "SELECT id FROM roles WHERE name ILIKE 'client' LIMIT 1",
    );
    const roleId = roleQuery.rows[0]?.id || 2;

    const newUser = await pool.query(
      `INSERT INTO users (email, password, full_name, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name`,
      [email, password, full_name, roleId],
    );

    const user = { ...newUser.rows[0], role: 'client' };
    const token = generateToken(user);

    res.status(201).json({
      message: 'Регистрация прошла успешно',
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        r.name AS role,
        c.code AS coupon_code,
        c.discount_percent AS coupon_discount
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN coupons c ON u.coupon_id = c.id
      WHERE u.id = $1
      `,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons/apply', optionalAuthenticate, async (req, res) => {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const { code } = req.body;

    if (!user_id || !code?.trim()) {
      return res.status(400).json({ error: 'Укажите промокод' });
    }

    const couponResult = await pool.query(
      'SELECT id, code, discount_percent FROM coupons WHERE code ILIKE $1 LIMIT 1',
      [code.trim()],
    );

    if (couponResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Промокод не найден или недействителен' });
    }

    const coupon = couponResult.rows[0];

    await pool.query('UPDATE users SET coupon_id = $1 WHERE id = $2', [
      coupon.id,
      user_id,
    ]);

    res.json({
      message: 'Купон успешно применен',
      coupon_code: coupon.code,
      coupon_discount: coupon.discount_percent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function verifyAdmin(reqOrId, res) {
  let userId;
  if (reqOrId && typeof reqOrId === 'object' && reqOrId.headers) {
    const authHeader = reqOrId.headers['authorization'];
    const token =
      authHeader && authHeader.startsWith('Bearer ') ?
        authHeader.split(' ')[1]
      : null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        reqOrId.user = decoded;
        userId = decoded.id;
      } catch {
        res
          .status(401)
          .json({ error: 'Недействительный или истёкший токен (401)' });
        return false;
      }
    } else {
      userId =
        reqOrId.query?.admin_id || reqOrId.body?.admin_id || reqOrId.user?.id;
    }
  } else {
    userId = reqOrId;
  }

  if (!userId) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return false;
  }

  const check = await pool.query(
    `SELECT r.name AS role 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE u.id = $1`,
    [userId],
  );

  if (check.rows[0]?.role?.toLowerCase() !== 'admin') {
    res
      .status(403)
      .json({ error: 'Доступ запрещён: требуется роль администратора' });
    return false;
  }
  return true;
}

app.get('/api/admin/users', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const result = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        r.name AS role,
        u.coupon_id,
        c.code AS coupon_code,
        c.discount_percent AS coupon_discount
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN coupons c ON u.coupon_id = c.id
      ORDER BY u.id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/coupons', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;

    const result = await pool.query(
      'SELECT id, code, discount_percent FROM coupons ORDER BY id DESC',
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/coupons', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;
    const { code, discount_percent } = req.body;

    if (!code?.trim() || !discount_percent) {
      return res
        .status(400)
        .json({ error: 'Заполните код купона и процент скидки' });
    }

    const discount = parseInt(discount_percent, 10);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      return res.status(400).json({ error: 'Скидка должна быть от 1 до 100%' });
    }

    const existing = await pool.query(
      'SELECT id FROM coupons WHERE code ILIKE $1',
      [code.trim()],
    );
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ error: 'Купон с таким кодом уже существует' });
    }

    const result = await pool.query(
      'INSERT INTO coupons (code, discount_percent) VALUES ($1, $2) RETURNING *',
      [code.trim().toUpperCase(), discount],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/users/assign-coupon', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;
    const { user_id, coupon_id } = req.body;

    if (!user_id || !coupon_id) {
      return res
        .status(400)
        .json({ error: 'Не указан пользователь или купон' });
    }

    await pool.query('UPDATE users SET coupon_id = $1 WHERE id = $2', [
      coupon_id,
      user_id,
    ]);

    res.json({ success: true, message: 'Купон успешно назначен' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:userId/coupon', async (req, res) => {
  try {
    if (!(await verifyAdmin(req, res))) return;
    const { userId } = req.params;

    await pool.query('UPDATE users SET coupon_id = NULL WHERE id = $1', [
      userId,
    ]);

    res.json({ success: true, message: 'Купон отозван' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const ALLOWED_ADMIN_TABLES = [
  'products',
  'categories',
  'users',
  'roles',
  'coupons',
  'orders',
  'order_items',
  'payments',
  'cart_items',
];

// Получение всех записей выбранной таблицы
app.get('/api/admin/tables/:table', async (req, res) => {
  try {
    const { table } = req.params;
    if (!(await verifyAdmin(req, res))) return;

    if (!ALLOWED_ADMIN_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Недопустимая таблица' });
    }

    if (table === 'users') {
      const result = await pool.query(`
        SELECT 
          u.id, 
          u.full_name, 
          u.email, 
          u.password,
          r.name AS role, 
          u.role_id, 
          u.coupon_id, 
          c.code AS coupon_code, 
          c.discount_percent AS coupon_discount
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN coupons c ON u.coupon_id = c.id
        ORDER BY u.id ASC
      `);
      return res.json(result.rows);
    }

    const result = await pool.query(`SELECT * FROM "${table}" ORDER BY id ASC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавление новой записи в таблицу
app.post('/api/admin/tables/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { data } = req.body;
    if (!(await verifyAdmin(req, res))) return;

    if (!ALLOWED_ADMIN_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Недопустимая таблица' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Данные не переданы' });
    }

    const colInfo = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_name = $1`,
      [table],
    );
    const validCols = new Map(colInfo.rows.map((c) => [c.column_name, c]));

    const keys = [];
    const values = [];
    const placeholders = [];

    for (const [key, rawVal] of Object.entries(data)) {
      if (key === 'id') continue;
      if (!validCols.has(key)) continue;

      const col = validCols.get(key);
      let val = rawVal;

      if (val === undefined || val === '') {
        val = null;
      } else if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') {
          val = null;
        } else if (
          col.data_type === 'integer' ||
          col.data_type === 'bigint' ||
          col.data_type === 'smallint'
        ) {
          const parsed = parseInt(trimmed, 10);
          val = isNaN(parsed) ? null : parsed;
        } else if (
          col.data_type === 'numeric' ||
          col.data_type === 'real' ||
          col.data_type === 'double precision'
        ) {
          const parsed = parseFloat(trimmed);
          val = isNaN(parsed) ? null : parsed;
        } else if (col.data_type === 'boolean') {
          val = trimmed === 'true' || trimmed === '1' || trimmed === 't';
        } else {
          val = trimmed;
        }
      }

      keys.push(`"${key}"`);
      values.push(val);
      placeholders.push(`$${values.length}`);
    }

    if (keys.length === 0) {
      return res.status(400).json({ error: 'Не указаны поля для добавления' });
    }

    const query = `
      INSERT INTO "${table}" (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const insertedId = result.rows[0]?.id;

    if (table === 'users' && insertedId) {
      const fullUser = await pool.query(
        `SELECT 
           u.id, 
           u.full_name, 
           u.email, 
           u.password,
           r.name AS role, 
           u.role_id, 
           u.coupon_id, 
           c.code AS coupon_code, 
           c.discount_percent AS coupon_discount
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN coupons c ON u.coupon_id = c.id
         WHERE u.id = $1`,
        [insertedId],
      );
      return res.status(201).json(fullUser.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновление существующей записи в таблице
app.put('/api/admin/tables/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const { data } = req.body;
    if (!(await verifyAdmin(req, res))) return;

    if (!ALLOWED_ADMIN_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Недопустимая таблица' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Данные не переданы' });
    }

    const colInfo = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_name = $1`,
      [table],
    );
    const validCols = new Map(colInfo.rows.map((c) => [c.column_name, c]));

    const updates = [];
    const values = [];

    for (const [key, rawVal] of Object.entries(data)) {
      if (key === 'id') continue;
      if (!validCols.has(key)) continue;

      const col = validCols.get(key);
      let val = rawVal;

      if (val === undefined || val === '') {
        val = null;
      } else if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') {
          val = null;
        } else if (
          col.data_type === 'integer' ||
          col.data_type === 'bigint' ||
          col.data_type === 'smallint'
        ) {
          const parsed = parseInt(trimmed, 10);
          val = isNaN(parsed) ? null : parsed;
        } else if (
          col.data_type === 'numeric' ||
          col.data_type === 'real' ||
          col.data_type === 'double precision'
        ) {
          const parsed = parseFloat(trimmed);
          val = isNaN(parsed) ? null : parsed;
        } else if (col.data_type === 'boolean') {
          val = trimmed === 'true' || trimmed === '1' || trimmed === 't';
        } else {
          val = trimmed;
        }
      }

      values.push(val);
      updates.push(`"${key}" = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет полей для обновления' });
    }

    values.push(id);
    const query = `
      UPDATE "${table}"
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    if (table === 'users') {
      const fullUser = await pool.query(
        `SELECT 
           u.id, 
           u.full_name, 
           u.email, 
           u.password,
           r.name AS role, 
           u.role_id, 
           u.coupon_id, 
           c.code AS coupon_code, 
           c.discount_percent AS coupon_discount
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN coupons c ON u.coupon_id = c.id
         WHERE u.id = $1`,
        [id],
      );
      return res.json(fullUser.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удаление записи из таблицы
app.delete('/api/admin/tables/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    if (!(await verifyAdmin(req, res))) return;

    if (!ALLOWED_ADMIN_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Недопустимая таблица' });
    }

    const result = await pool.query(
      `DELETE FROM "${table}" WHERE id = $1 RETURNING id`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    res.json({
      success: true,
      message: 'Запись удалена',
      id: result.rows[0].id,
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        error:
          'Невозможно удалить запись: на неё ссылаются другие связанные данные',
        detail: error.detail,
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
