// ============================================================================
// MODUL: LOGIKA BISNIS & OOP (J.620100.018.02)
// File: controllers/MobilController.js
// ============================================================================

const db = require('../config/database');

/**
 * Kelas MobilController menangani semua operasi logika untuk entitas Mobil.
 */
class MobilController {
    
    /**
     * READ: Mengambil seluruh data mobil.
     */
    static async getAll(req, res) {
        try {
            // Mengambil data dan mengurutkan berdasarkan id terbaru
            const query = "SELECT * FROM mobil_sport ORDER BY id DESC";
            const result = await db.query(query);
            
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("[ERROR] getAll:", error.message);
            res.status(500).json({ error: "Gagal mengambil data dari database." });
        }
    }

    /**
     * CREATE: Menambahkan data mobil baru ke database.
     */
    static async create(req, res) {
        try {
            const { merk, model, tahun } = req.body;
            
            // Validasi Input (Struktur Kontrol)
            if (!merk || !model || !tahun) {
                return res.status(400).json({ error: "Merk, model, dan tahun harus diisi!" });
            }

            const query = "INSERT INTO mobil_sport (merk, model, tahun) VALUES ($1, $2, $3) RETURNING *";
            const values = [merk, model, tahun];
            const result = await db.query(query, values);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error("[ERROR] create:", error.message);
            res.status(500).json({ error: "Gagal menyimpan data ke database.", errorDetail: error.message });
        }
    }

    /**
     * UPDATE: Memperbarui data mobil berdasarkan ID.
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { merk, model, tahun } = req.body;

            const query = "UPDATE mobil_sport SET merk = $1, model = $2, tahun = $3 WHERE id = $4 RETURNING *";
            const values = [merk, model, tahun, id];
            const result = await db.query(query, values);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: "Data tidak ditemukan." });
            }

            res.status(200).json({ message: "Data berhasil diupdate!", data: result.rows[0] });
        } catch (error) {
            console.error("[ERROR] update:", error.message);
            res.status(500).json({ error: "Gagal memperbarui data." });
        }
    }

    /**
     * DELETE: Menghapus data mobil berdasarkan ID.
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const query = "DELETE FROM mobil_sport WHERE id = $1 RETURNING *";
            const result = await db.query(query, [id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: "Data tidak ditemukan untuk dihapus." });
            }

            res.status(200).json({ message: "Data berhasil dihapus!" });
        } catch (error) {
            console.error("[ERROR] delete:", error.message);
            res.status(500).json({ error: "Gagal menghapus data." });
        }
    }
}

module.exports = MobilController;
