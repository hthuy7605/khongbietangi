const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Routes

// GET all monAn
app.get('/api/monan', async (req, res) => {
    try {
        const { category } = req.query;
        console.log(`[${new Date().toISOString()}] GET /api/monan - Category: ${category || 'All'}`);
        let query = 'SELECT * FROM monAn';
        let params = [];

        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }

        query += ' ORDER BY priority DESC';
        const result = await pool.query(query, params);
        console.log(`[${new Date().toISOString()}] GET /api/monan - Success: ${result.rows.length} dishes`);
        res.json(result.rows);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] GET /api/monan - Error:`, err.message);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// GET single monAn by ID
app.get('/api/monan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[${new Date().toISOString()}] GET /api/monan/${id}`);
        const result = await pool.query('SELECT * FROM monAn WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            console.log(`[${new Date().toISOString()}] GET /api/monan/${id} - Not found`);
            return res.status(404).json({ error: 'Món ăn không tồn tại' });
        }
        console.log(`[${new Date().toISOString()}] GET /api/monan/${id} - Success`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] GET /api/monan/${req.params.id} - Error:`, err.message);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// POST a new monAn
app.post('/api/monan', async (req, res) => {
    try {
        const { district, address, category, priority } = req.body;
        console.log(`[${new Date().toISOString()}] POST /api/monan - Body:`, { district, address, category, priority });
        const newMonAn = await pool.query(
            'INSERT INTO monAn (district, address, category, priority) VALUES ($1, $2, $3, $4) RETURNING *',
            [district, address, category, priority]
        );
        console.log(`[${new Date().toISOString()}] POST /api/monan - Success: ID ${newMonAn.rows[0].id}`);
        res.json(newMonAn.rows[0]);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] POST /api/monan - Error:`, err.message);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// PUT update monAn
app.put('/api/monan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { district, address, category, priority } = req.body;
        console.log(`[${new Date().toISOString()}] PUT /api/monan/${id} - Body:`, { district, address, category, priority });
        const result = await pool.query(
            'UPDATE monAn SET district = $1, address = $2, category = $3, priority = $4 WHERE id = $5 RETURNING *',
            [district, address, category, priority, id]
        );
        if (result.rows.length === 0) {
            console.log(`[${new Date().toISOString()}] PUT /api/monan/${id} - Not found`);
            return res.status(404).json({ error: 'Món ăn không tồn tại' });
        }
        console.log(`[${new Date().toISOString()}] PUT /api/monan/${id} - Success`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] PUT /api/monan/${req.params.id} - Error:`, err.message);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// DELETE monAn
app.delete('/api/monan/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[${new Date().toISOString()}] DELETE /api/monan/${id}`);
        const result = await pool.query('DELETE FROM monAn WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            console.log(`[${new Date().toISOString()}] DELETE /api/monan/${id} - Not found`);
            return res.status(404).json({ error: 'Món ăn không tồn tại' });
        }
        console.log(`[${new Date().toISOString()}] DELETE /api/monan/${id} - Success`);
        res.json({ message: 'Đã xóa món ăn', deleted: result.rows[0] });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] DELETE /api/monan/${req.params.id} - Error:`, err.message);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// POST login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[${new Date().toISOString()}] POST /api/login - Username: ${username}`);

        if (!username || !password) {
            console.log(`[${new Date().toISOString()}] POST /api/login - Missing credentials`);
            return res.status(400).json({ error: 'Username và password là bắt buộc' });
        }

        // Query from database
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            console.log(`[${new Date().toISOString()}] POST /api/login - Success`);
            res.json({ success: true, message: 'Đăng nhập thành công' });
        } else {
            console.log(`[${new Date().toISOString()}] POST /api/login - Invalid credentials`);
            res.status(401).json({ error: 'Username hoặc password không đúng' });
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] POST /api/login - Error:`, err.message);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});