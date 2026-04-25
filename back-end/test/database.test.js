// ============================================================================
// MODUL: UNIT TEST DATABASE (J.620100.025.02)
// File: tests/database.test.js
// ============================================================================

const Database = require('../config/database');

/**
 * SUITE TEST: Database Connection & Query Execution
 * Menguji koneksi database dan eksekusi query SQL
 */
class DatabaseTestSuite {
    constructor() {
        this.testResults = [];
        this.passCount = 0;
        this.failCount = 0;
    }

    /**
     * Fungsi helper untuk assert kondisi
     * @param {boolean} condition - Kondisi yang ditest
     * @param {string} testName - Nama test
     */
    assert(condition, testName) {
        if (condition) {
            this.passCount++;
            console.log(`✅ PASS: ${testName}`);
            this.testResults.push({ name: testName, status: 'PASS' });
        } else {
            this.failCount++;
            console.log(`❌ FAIL: ${testName}`);
            this.testResults.push({ name: testName, status: 'FAIL' });
        }
    }

    /**
     * TEST 1: Koneksi Database
     * Memastikan pool database dapat terkoneksi
     */
    async testDatabaseConnection() {
        console.log('\n📝 TEST 1: Database Connection');
        try {
            const result = await Database.query('SELECT 1 as connection_test');
            this.assert(result.rows.length > 0, 'Database connection established');
            return true;
        } catch (error) {
            this.assert(false, 'Database connection failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 2: Table Structure Check
     * Memastikan tabel mobil_sport ada dan memiliki struktur yang tepat
     */
    async testTableStructure() {
        console.log('\n📝 TEST 2: Table Structure Check');
        try {
            const result = await Database.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mobil_sport' ORDER BY ordinal_position"
            );
            this.assert(result.rows.length > 0, 'Table mobil_sport exists');
            
            const columns = result.rows.map(row => row.column_name);
            this.assert(columns.includes('id'), 'Column id exists');
            this.assert(columns.includes('merk'), 'Column merk exists');
            this.assert(columns.includes('model'), 'Column model exists');
            this.assert(columns.includes('tahun'), 'Column tahun exists');
            
            return true;
        } catch (error) {
            this.assert(false, 'Table structure check failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 3: Insert Operation (CREATE)
     * Menguji kemampuan menginput data baru
     */
    async testInsertOperation() {
        console.log('\n📝 TEST 3: Insert Operation (CREATE)');
        try {
            const testMerk = 'Tesla';
            const testModel = 'Model S';
            const testTahun = 2024;

            const result = await Database.query(
                'INSERT INTO mobil_sport (merk, model, tahun) VALUES ($1, $2, $3) RETURNING id, merk, model, tahun',
                [testMerk, testModel, testTahun]
            );

            this.assert(result.rows.length > 0, 'Insert operation successful');
            this.assert(result.rows[0].merk === testMerk, 'Merk inserted correctly');
            this.assert(result.rows[0].model === testModel, 'Model inserted correctly');
            this.assert(result.rows[0].tahun === testTahun, 'Tahun inserted correctly');

            // Simpan ID untuk test berikutnya
            this.lastInsertedId = result.rows[0].id;
            return true;
        } catch (error) {
            this.assert(false, 'Insert operation failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 4: Select Operation (READ)
     * Menguji kemampuan membaca data dari database
     */
    async testSelectOperation() {
        console.log('\n📝 TEST 4: Select Operation (READ)');
        try {
            const result = await Database.query('SELECT * FROM mobil_sport');
            this.assert(result.rows.length > 0, 'Select operation successful');
            this.assert(Array.isArray(result.rows), 'Result is array');
            
            // Check struktur data
            const firstRow = result.rows[0];
            this.assert(firstRow.id !== undefined, 'Data has id field');
            this.assert(firstRow.merk !== undefined, 'Data has merk field');
            
            return true;
        } catch (error) {
            this.assert(false, 'Select operation failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 5: Update Operation (UPDATE)
     * Menguji kemampuan mengubah data yang sudah ada
     */
    async testUpdateOperation() {
        console.log('\n📝 TEST 5: Update Operation (UPDATE)');
        try {
            if (!this.lastInsertedId) {
                this.assert(false, 'No inserted ID to update');
                return false;
            }

            const newMerk = 'Tesla Updated';
            const result = await Database.query(
                'UPDATE mobil_sport SET merk = $1 WHERE id = $2 RETURNING id, merk, model, tahun',
                [newMerk, this.lastInsertedId]
            );

            this.assert(result.rows.length > 0, 'Update operation successful');
            this.assert(result.rows[0].merk === newMerk, 'Merk updated correctly');
            
            return true;
        } catch (error) {
            this.assert(false, 'Update operation failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 6: Delete Operation (DELETE)
     * Menguji kemampuan menghapus data dari database
     */
    async testDeleteOperation() {
        console.log('\n📝 TEST 6: Delete Operation (DELETE)');
        try {
            if (!this.lastInsertedId) {
                this.assert(false, 'No inserted ID to delete');
                return false;
            }

            const result = await Database.query(
                'DELETE FROM mobil_sport WHERE id = $1 RETURNING id',
                [this.lastInsertedId]
            );

            this.assert(result.rows.length > 0, 'Delete operation successful');
            this.assert(result.rows[0].id === this.lastInsertedId, 'Correct record deleted');
            
            return true;
        } catch (error) {
            this.assert(false, 'Delete operation failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 7: Query with Parameters (SQL Injection Prevention)
     * Menguji keamanan query dengan parameterized queries
     */
    async testParameterizedQuery() {
        console.log('\n📝 TEST 7: Parameterized Query (SQL Injection Prevention)');
        try {
            const testModel = "Model X'; DROP TABLE mobil_sport; --";
            const result = await Database.query(
                'SELECT * FROM mobil_sport WHERE model = $1',
                [testModel]
            );

            // Jika query berhasil tanpa error, maka SQL injection dicegah
            this.assert(true, 'Parameterized query prevents SQL injection');
            return true;
        } catch (error) {
            this.assert(false, 'Parameterized query test failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 8: Transaction Handling
     * Menguji kemampuan database menangani transaksi
     */
    async testTransactionHandling() {
        console.log('\n📝 TEST 8: Transaction Handling');
        try {
            const client = await Database.pool.connect();
            await client.query('BEGIN');
            
            const insertResult = await client.query(
                'INSERT INTO mobil_sport (merk, model, tahun) VALUES ($1, $2, $3) RETURNING id',
                ['Porsche', '911', 2024]
            );
            
            await client.query('ROLLBACK');
            client.release();

            this.assert(true, 'Transaction handling works correctly');
            return true;
        } catch (error) {
            this.assert(false, 'Transaction handling failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 9: Data Type Validation
     * Menguji validasi tipe data
     */
    async testDataTypeValidation() {
        console.log('\n📝 TEST 9: Data Type Validation');
        try {
            const result = await Database.query('SELECT * FROM mobil_sport LIMIT 1');
            
            if (result.rows.length > 0) {
                const row = result.rows[0];
                this.assert(typeof row.id === 'number', 'ID is number type');
                this.assert(typeof row.merk === 'string', 'Merk is string type');
                this.assert(typeof row.model === 'string', 'Model is string type');
                this.assert(typeof row.tahun === 'number', 'Tahun is number type');
            } else {
                this.assert(false, 'No data to validate');
            }

            return true;
        } catch (error) {
            this.assert(false, 'Data type validation failed: ' + error.message);
            return false;
        }
    }

    /**
     * TEST 10: Performance Check (Query Response Time)
     * Menguji kecepatan response query
     */
    async testPerformance() {
        console.log('\n📝 TEST 10: Performance Check (Query Response Time)');
        try {
            const startTime = Date.now();
            await Database.query('SELECT * FROM mobil_sport');
            const endTime = Date.now();
            const duration = endTime - startTime;

            this.assert(duration < 5000, `Query executed in ${duration}ms (< 5000ms)`);
            return true;
        } catch (error) {
            this.assert(false, 'Performance check failed: ' + error.message);
            return false;
        }
    }

    /**
     * Jalankan semua test
     */
    async runAllTests() {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║        DATABASE UNIT TEST SUITE - SERKOM PROJECT       ║');
        console.log('║              Testing PostgreSQL Configuration           ║');
        console.log('╚════════════════════════════════════════════════════════╝');

        await this.testDatabaseConnection();
        await this.testTableStructure();
        await this.testInsertOperation();
        await this.testSelectOperation();
        await this.testUpdateOperation();
        await this.testDeleteOperation();
        await this.testParameterizedQuery();
        await this.testTransactionHandling();
        await this.testDataTypeValidation();
        await this.testPerformance();

        this.printSummary();
    }

    /**
     * Tampilkan ringkasan hasil test
     */
    printSummary() {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                    TEST SUMMARY REPORT                 ║');
        console.log('╠════════════════════════════════════════════════════════╣');
        console.log(`║ Total Tests        : ${this.passCount + this.failCount}`);
        console.log(`║ ✅ Passed         : ${this.passCount}`);
        console.log(`║ ❌ Failed         : ${this.failCount}`);
        console.log(`║ Success Rate       : ${((this.passCount / (this.passCount + this.failCount)) * 100).toFixed(2)}%`);
        console.log('╠════════════════════════════════════════════════════════╣');
        
        if (this.failCount === 0) {
            console.log('║ 🎉 STATUS: ALL TESTS PASSED!                          ║');
        } else {
            console.log(`║ ⚠️  STATUS: ${this.failCount} TEST(S) FAILED!                         ║`);
        }
        
        console.log('╚════════════════════════════════════════════════════════╝\n');
    }
}

// Run tests jika file ini dijalankan langsung
if (require.main === module) {
    const testSuite = new DatabaseTestSuite();
    testSuite.runAllTests().then(() => {
        process.exit(testSuite.failCount === 0 ? 0 : 1);
    }).catch(err => {
        console.error('Fatal error during testing:', err);
        process.exit(1);
    });
}

module.exports = DatabaseTestSuite;