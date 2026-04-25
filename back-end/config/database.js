// ============================================================================
// MODUL: KONEKSI BASIS DATA (J.620100.021.02)
// File: config/database.js
// ============================================================================

const { Pool } = require('pg');

/**
 * Kelas Database merepresentasikan koneksi ke PostgreSQL.
 * Menggunakan prinsip Singleton agar tidak terjadi koneksi ganda.
 * @parameter {Pool} pool - Instance Pool untuk koneksi database
 * @method query - Menjalankan query SQL dengan parameter
 * @event error - Menangani error koneksi database (Debugging - J.620100.025.02)
 */
class Database {
    constructor() {
        // Konfigurasi koneksi database sesuai dengan setup custom kamu
        this.pool = new Pool({
            user: 'postgres',
            password: '290922',
            host: '127.0.0.1', // Jika error, coba ganti jadi 'localhost' atau '127.0.0.1'
            port: 5431,
            database: 'showroom_db'
        });

        // Event listener untuk memantau error pada koneksi (Debugging - J.620100.025.02)
        this.pool.on('error', (err) => {
            console.error('Terjadi kesalahan pada koneksi basis data:', err.message);
        });
    }

    /**
     * Mengeksekusi Query SQL ke PostgreSQL.
     * @param {string} text - Sintaks SQL
     * @param {Array} params - Parameter untuk query (mencegah SQL Injection)
     * @returns {Promise<Object>} Hasil query database
     */
    async query(text, params) {
        return await this.pool.query(text, params);
    }
}

// Mengekspor satu instance (Singleton) untuk digunakan di seluruh aplikasi
module.exports = new Database()