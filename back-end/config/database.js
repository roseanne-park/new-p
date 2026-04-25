const { Pool } = require('pg');
/**
 * Kelas Database merepresentasikan koneksi ke PostgreSQL.
 * Menggunakan prinsip Singleton agar tidak terjadi koneksi ganda.
 * 
 * 
 * @parameter {Pool} pool - Instance Pool untuk koneksi database
 * @method query - Menjalankan query SQL dengan parameter
 * @event error - Menangani error koneksi database Debugging
 */
class Database {
    constructor() {
        // Konfigurasi koneksi database sesuai dengan setup custom kamu
        this.pool = new Pool({
            user: 'postgres',
            password: '290922',
            host: '127.0.0.1',
            port: 5431,      
            database: 'philips' 
        });

        // Event listener untuk memantau error pada koneksi database
        this.pool.on('error', (err) => {
            console.error('❌ Terjadi kesalahan pada koneksi basis data:', err.message);
        });

        // Success message
        console.log('✅ Database Pool initialized for PHILIPS ELECTRONICS STORE');
    }

    /**
     * Mengeksekusi Query SQL ke PostgreSQL.
     * @param {string} text - Sintaks SQL
     * @param {Array} params - Parameter untuk query (mencegah SQL Injection)
     * @returns {Promise<Object>} Hasil query database
     */
    async query(text, params) {
        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            console.error('❌ Query Error:', error.message);
            throw error;
        }
    }

    /**
     * Menutup koneksi database pool
     * Digunakan saat aplikasi shutdown
     */
    async closePool() {
        try {
            await this.pool.end();
            console.log('✅ Database pool closed successfully');
        } catch (error) {
            console.error('❌ Error closing pool:', error.message);
        }
    }
}

// Mengekspor satu instance (Singleton) untuk digunakan di seluruh aplikasi
module.exports = new Database()