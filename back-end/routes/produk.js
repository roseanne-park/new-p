
/**
 * 
 * METHOD: Express.js Router untuk endpoint /produk
 * - GET /produk - Ambil semua produk (dengan filter & sort)
 * - GET /produk/:id - Ambil produk by ID
 * - POST /produk - Tambah produk baru
 * - PUT /produk/:id - Update produk
 * - DELETE /produk/:id - Hapus produk
 * 
 */

const express = require('express');
const db = require('../config/database');

const router = express.Router();

/**
 * GET /produk
 * 
 * QUERY PARAMETERS (Optional):
 * - kategori: filter by kategori (e.g. ?kategori=Television)
 * - search: search by nama atau deskripsi (e.g. ?search=TV)
 * - sortBy: sort field (nama, harga, stok, tgl_dibuat) (e.g. ?sortBy=harga)
 * - order: ASC atau DESC (e.g. ?order=DESC)
 * - limit: jumlah record per page (default: 50)
 * - offset: pagination offset (default: 0)
 * 
 * 
 */
router.get('/produk', async (req, res) => {
  try {
    const { kategori, search, sortBy = 'id', order = 'ASC', limit = 50, offset = 0 } = req.query;

    // Validasi sort field (prevent SQL injection)
    const allowedSortFields = ['id', 'nama', 'harga', 'stok', 'tgl_dibuat', 'tgl_diperbarui'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const sortOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

    // BUILD QUERY dengan WHERE clause
    let query = 'SELECT * FROM produk WHERE 1=1';
    let params = [];
    let paramCount = 1;

    // Filter by kategori
    if (kategori) {
      query += ` AND kategori = $${paramCount}`;
      params.push(kategori);
      paramCount++;
    }

    // Search by nama atau deskripsi
    if (search) {
      query += ` AND (LOWER(nama) LIKE LOWER($${paramCount}) OR LOWER(deskripsi) LIKE LOWER($${paramCount}))`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // SORTING & PAGINATION
    query += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    // Execute query
    const result = await db.query(query, params);

    // Get total count untuk pagination
    let countQuery = 'SELECT COUNT(*) as total FROM produk WHERE 1=1';
    let countParams = [];
    let countParamCount = 1;

    if (kategori) {
      countQuery += ` AND kategori = $${countParamCount}`;
      countParams.push(kategori);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (LOWER(nama) LIKE LOWER($${countParamCount}) OR LOWER(deskripsi) LIKE LOWER($${countParamCount}))`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Response dengan pagination info
    res.status(200).json({
      success: true,
      message: '✅ Data produk berhasil diambil',
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1
      }
    });

  } catch (error) {
    console.error('❌ Error GET /produk:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Gagal mengambil data produk',
      error: error.message
    });
  }
});

/**
 * GET /produk/:id
 * 
 * PATH PARAMETERS:
 * - id: ID produk (integer)
 * 
 */
router.get('/produk/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '❌ ID produk harus berupa angka'
      });
    }

    // Query
    const result = await db.query('SELECT * FROM produk WHERE id = $1', [id]);

    // Check jika data tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ Produk tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Produk berhasil diambil',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error GET /produk/:id:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Gagal mengambil data produk',
      error: error.message
    });
  }
});

/**
 * POST /produk
 * 
 * REQUEST BODY:
 * {
 *   "nama": "TV Smart Philips 55 inch",
 *   "deskripsi": "Smart TV dengan 4K resolution",
 *   "kategori": "Television",
 *   "harga": 5000000,
 *   "stok": 10
 * }
 * 
 * VALIDASI:
 * - nama: required, string (max 255 char)
 * - deskripsi: optional, text
 * - kategori: required, enum (Television, Audio, Lighting, Appliances, Health, Accessories)
 * - harga: required, integer (> 0)
 * - stok: required, integer (>= 0)
 *
 */
router.post('/produk', async (req, res) => {
  try {
    const { nama, deskripsi = '', kategori, harga, stok = 0 } = req.body;

    // ──────────────────────────────────────────────────────────────────
    // VALIDATION - (Error Handling)
    // ──────────────────────────────────────────────────────────────────

    if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Nama produk harus diisi dan berupa string'
      });
    }

    if (nama.length > 255) {
      return res.status(400).json({
        success: false,
        message: '❌ Nama produk maksimal 255 karakter'
      });
    }

    const validCategories = ['Television', 'Audio', 'Lighting', 'Appliances', 'Health', 'Accessories'];
    if (!kategori || !validCategories.includes(kategori)) {
      return res.status(400).json({
        success: false,
        message: `❌ Kategori harus salah satu dari: ${validCategories.join(', ')}`
      });
    }

    if (!harga || isNaN(harga) || parseInt(harga) <= 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Harga harus berupa angka dan > 0'
      });
    }

    if (isNaN(stok) || parseInt(stok) < 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Stok harus berupa angka dan >= 0'
      });
    }

    // ──────────────────────────────────────────────────────────────────
    // EXECUTE INSERT
    // ──────────────────────────────────────────────────────────────────

    const insertQuery = `
      INSERT INTO produk (nama, deskripsi, kategori, harga, stok)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      nama.trim(),
      deskripsi.trim(),
      kategori,
      parseInt(harga),
      parseInt(stok)
    ]);

    res.status(201).json({
      success: true,
      message: '✅ Produk baru berhasil ditambahkan',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error POST /produk:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Gagal menambah produk baru',
      error: error.message
    });
  }
});

/**
 * PUT /produk/:id
 * 
 * PATH PARAMETERS:
 * - id: ID produk
 * 
 * REQUEST BODY: (partial update - hanya field yang ingin diubah)
 * {
 *   "nama": "TV Smart Philips 65 inch",
 *   "harga": 6000000,
 *   "stok": 15
 * }
 * 
 * KOMPETENSI: J.620100.021.02 - Update data dengan validasi
 */
router.put('/produk/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, kategori, harga, stok } = req.body;

    // Validasi ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '❌ ID produk harus berupa angka'
      });
    }

    // Check jika produk ada
    const checkQuery = 'SELECT * FROM produk WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ Produk tidak ditemukan'
      });
    }

    const currData = checkResult.rows[0];

    // ──────────────────────────────────────────────────────────────────
    // BUILD UPDATE QUERY (hanya update field yang ada di request)
    // ──────────────────────────────────────────────────────────────────

    let updateFields = [];
    let updateParams = [];
    let paramCount = 1;

    if (nama !== undefined) {
      if (typeof nama !== 'string' || nama.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '❌ Nama produk harus berupa string dan tidak kosong'
        });
      }
      updateFields.push(`nama = $${paramCount}`);
      updateParams.push(nama.trim());
      paramCount++;
    }

    if (deskripsi !== undefined) {
      updateFields.push(`deskripsi = $${paramCount}`);
      updateParams.push(deskripsi);
      paramCount++;
    }

    if (kategori !== undefined) {
      const validCategories = ['Television', 'Audio', 'Lighting', 'Appliances', 'Health', 'Accessories'];
      if (!validCategories.includes(kategori)) {
        return res.status(400).json({
          success: false,
          message: `❌ Kategori harus salah satu dari: ${validCategories.join(', ')}`
        });
      }
      updateFields.push(`kategori = $${paramCount}`);
      updateParams.push(kategori);
      paramCount++;
    }

    if (harga !== undefined) {
      if (isNaN(harga) || parseInt(harga) <= 0) {
        return res.status(400).json({
          success: false,
          message: '❌ Harga harus berupa angka dan > 0'
        });
      }
      updateFields.push(`harga = $${paramCount}`);
      updateParams.push(parseInt(harga));
      paramCount++;
    }

    if (stok !== undefined) {
      if (isNaN(stok) || parseInt(stok) < 0) {
        return res.status(400).json({
          success: false,
          message: '❌ Stok harus berupa angka dan >= 0'
        });
      }
      updateFields.push(`stok = $${paramCount}`);
      updateParams.push(parseInt(stok));
      paramCount++;
    }

    // Jika tidak ada field yang diubah
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Tidak ada field yang diubah'
      });
    }

    // ──────────────────────────────────────────────────────────────────
    // EXECUTE UPDATE
    // ──────────────────────────────────────────────────────────────────

    updateParams.push(id);
    const updateQuery = `
      UPDATE produk
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, updateParams);

    res.status(200).json({
      success: true,
      message: '✅ Produk berhasil diperbarui',
      data: result.rows[0],
      changes: {
        before: currData,
        after: result.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error PUT /produk/:id:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Gagal memperbarui produk',
      error: error.message
    });
  }
});

/**
 * DELETE /produk/:id
 * 
 * PATH PARAMETERS:
 * - id: ID produk
 * 
 */
router.delete('/produk/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '❌ ID produk harus berupa angka'
      });
    }

    // Check jika produk ada
    const checkQuery = 'SELECT * FROM produk WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ Produk tidak ditemukan'
      });
    }

    const deletedData = checkResult.rows[0];

    // Execute DELETE
    const deleteQuery = 'DELETE FROM produk WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.status(200).json({
      success: true,
      message: '✅ Produk berhasil dihapus',
      deletedData: deletedData
    });

  } catch (error) {
    console.error('❌ Error DELETE /produk/:id:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Gagal menghapus produk',
      error: error.message
    });
  }
});

// Export router
module.exports = router;