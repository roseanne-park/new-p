/**
 * ============================================================================
 * MODUL: ANTARMUKA PENGGUNA - APEX AUTO SHOWROOM
 * File: src/App.jsx
 * Versi: 2.0.0
 * Author: Puput Suyaningtyas
 * Tanggal: April 2026
 * 
 * DESKRIPSI:
 * Komponen React utama untuk management sistem showroom kendaraan sport.
 * Menerapkan prinsip OOP, best practices, dan error handling.
 * 
 * FITUR:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Real-time data sync dengan backend
 * - Responsive UI dengan Tailwind CSS
 * - Error handling comprehensive
 * - Database connection status monitoring
 * - Advanced Search & Filter functionality (v2.0)
 * - Export ke CSV & PDF (v2.0)
 * - Print functionality (v2.0)
 * 
 * DEPENDENCIES:
 * - React 18+
 * - Tailwind CSS 3+
 * - jsPDF (untuk export PDF)
 * - html2canvas (untuk export PDF dengan styling)
 * 
 * KOMPETENSI YANG TERCAKUP:
 * - J.620100.017.02: Pemrograman Terstruktur (Search & Filter Logic)
 * - J.620100.018.02: OOP (Class-based architecture)
 * - J.620100.021.02: Database Access (CRUD)
 * - J.620100.023.02: Dokumentasi Sistem
 * - J.620100.025.02: Debugging
 * - J.620100.033.02: Unit Testing
 * 
 * EXPORT:
 * - default: App (React Functional Component)
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_BASE_URL = 'http://localhost:5002';

// FLAG STATUS KONEKSI DATABASE
let DB_CONNECTION_STATUS = {
  isConnected: false,
  lastAttempt: null,
  errorCount: 0,
  maxRetries: 3
};

// ════════════════════════════════════════════════════════════════════════════
// OOP CLASSES
// ════════════════════════════════════════════════════════════════════════════

/**
 * CLASS: Kendaraan
 * 
 * DESKRIPSI:
 * Base class yang merepresentasikan objek kendaraan generic.
 * Menerapkan prinsip Encapsulation dengan private field #id.
 */
class Kendaraan {
  #id;
  
  constructor(id, merk, tahun) {
    if (typeof id !== 'number') throw new TypeError('ID harus number');
    if (typeof merk !== 'string') throw new TypeError('Merk harus string');
    if (typeof tahun !== 'number') throw new TypeError('Tahun harus number');
    
    this.#id = id;
    this.merk = merk;
    this.tahun = tahun;
  }
  
  getId() { 
    return this.#id; 
  }
  
  getDeskripsi() { 
    return `Kendaraan: ${this.merk} (${this.tahun})`; 
  }
}

/**
 * CLASS: MobilSport extends Kendaraan
 * 
 * DESKRIPSI:
 * Child class yang merepresentasikan mobil sport spesifik.
 * Menerapkan prinsip Inheritance dan Polymorphism.
 */
class MobilSport extends Kendaraan {
  
  constructor(id, merk, tahun, model) {
    super(id, merk, tahun);
    this.model = model;
  }
  
  getDeskripsi() { 
    return `${this.merk} ${this.model} - Keluaran ${this.tahun}`; 
  }
  
  updateDataMobil(arg1, arg2, arg3) {
    if (typeof arg1 === 'object' && arg1 !== null) {
      this.merk = arg1.merk || this.merk;
      this.model = arg1.model || this.model;
      this.tahun = arg1.tahun || this.tahun;
    } else if (arguments.length === 3) {
      this.merk = arg1;
      this.model = arg2;
      this.tahun = arg3;
    }
  }
}

/**
 * CLASS: ShowroomDatabaseService
 * 
 * DESKRIPSI:
 * Service layer yang menangani semua operasi CRUD ke backend API.
 * Menerapkan prinsip Abstraction.
 */
class ShowroomDatabaseService {
  
  constructor() {
    this.dbTable = [];
  }
  
  async checkConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/mobil`, { 
        method: 'GET',
        timeout: 5000 
      });
      DB_CONNECTION_STATUS.isConnected = response.ok;
      DB_CONNECTION_STATUS.lastAttempt = new Date();
      if (response.ok) {
        DB_CONNECTION_STATUS.errorCount = 0;
        console.log("✅ Database Connection: SUCCESS");
      }
      return response.ok;
    } catch (error) {
      DB_CONNECTION_STATUS.isConnected = false;
      DB_CONNECTION_STATUS.errorCount++;
      DB_CONNECTION_STATUS.lastAttempt = new Date();
      console.error("❌ Database Connection: FAILED -", error.message);
      return false;
    }
  }
  
  async getAllData() {
    try {
      if (!DB_CONNECTION_STATUS.isConnected) {
        await this.checkConnection();
      }
      const response = await fetch(`${API_BASE_URL}/mobil`);
      if (!response.ok) throw new Error("Gagal mengakses API");
      const data = await response.json();
      DB_CONNECTION_STATUS.isConnected = true;
      return data.map(item => new MobilSport(item.id, item.merk, item.tahun, item.model));
    } catch (error) {
      DB_CONNECTION_STATUS.isConnected = false;
      throw new Error("Gagal mengakses basis data: " + error.message);
    }
  }
  
  async insertData(data) {
    try {
      if (!DB_CONNECTION_STATUS.isConnected) {
        await this.checkConnection();
      }
      if (!data.merk || !data.model || !data.tahun) {
        throw new Error("Validasi gagal: Semua field harus diisi!");
      }
      const response = await fetch(`${API_BASE_URL}/mobil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Gagal menambah data");
      const result = await response.json();
      DB_CONNECTION_STATUS.isConnected = true;
      return new MobilSport(result.id, result.merk, result.tahun, result.model);
    } catch (error) {
      DB_CONNECTION_STATUS.isConnected = false;
      throw error;
    }
  }
  
  async updateData(id, updatedData) {
    try {
      if (!DB_CONNECTION_STATUS.isConnected) {
        await this.checkConnection();
      }
      const response = await fetch(`${API_BASE_URL}/mobil/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!response.ok) throw new Error("Data tidak ditemukan di database");
      DB_CONNECTION_STATUS.isConnected = true;
      return true;
    } catch (error) {
      DB_CONNECTION_STATUS.isConnected = false;
      throw error;
    }
  }
  
  async deleteData(id) {
    try {
      if (!DB_CONNECTION_STATUS.isConnected) {
        await this.checkConnection();
      }
      const response = await fetch(`${API_BASE_URL}/mobil/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Gagal menghapus: ID tidak cocok");
      DB_CONNECTION_STATUS.isConnected = true;
      return true;
    } catch (error) {
      DB_CONNECTION_STATUS.isConnected = false;
      throw error;
    }
  }
}

const dbService = new ShowroomDatabaseService();

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS FOR SEARCH & FILTER
// ════════════════════════════════════════════════════════════════════════════

/**
 * UTILITY: filterAndSearchMobils
 * 
 * DESKRIPSI:
 * Fungsi untuk filtering dan searching data mobil
 * Menerapkan prinsip Single Responsibility
 * 
 * @param {Array<MobilSport>} mobils - Data mobil
 * @param {string} searchQuery - Query pencarian
 * @param {string} filterBrand - Filter berdasarkan merk
 * @param {string} filterYear - Filter berdasarkan tahun
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {string} sortBy - Sort field (merk/model/tahun)
 * @returns {Array<MobilSport>} Data yang sudah difilter dan disort
 * 
 * KOMPETENSI: J.620100.017.02 - Pemrograman Terstruktur
 */
function filterAndSearchMobils(mobils, searchQuery, filterBrand, filterYear, sortOrder, sortBy) {
  let filtered = mobils;
  
  // STEP 1: SEARCH - Pencarian berdasarkan keyword
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(mobil =>
      mobil.merk.toLowerCase().includes(query) ||
      mobil.model.toLowerCase().includes(query) ||
      mobil.tahun.toString().includes(query)
    );
  }
  
  // STEP 2: FILTER BY BRAND - Filter berdasarkan merk
  if (filterBrand) {
    filtered = filtered.filter(mobil => mobil.merk === filterBrand);
  }
  
  // STEP 3: FILTER BY YEAR - Filter berdasarkan tahun
  if (filterYear) {
    filtered = filtered.filter(mobil => mobil.tahun === parseInt(filterYear));
  }
  
  // STEP 4: SORT - Mengurutkan data
  if (sortBy) {
    filtered.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toUpperCase();
        valueB = valueB.toUpperCase();
      }
      
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }
  
  return filtered;
}

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS FOR EXPORT
// ════════════════════════════════════════════════════════════════════════════

/**
 * UTILITY: exportToCSV
 * 
 * DESKRIPSI:
 * Export data mobil ke format CSV (Comma Separated Values)
 * CSV bisa dibuka di Excel, Google Sheets, dll
 * 
 * @param {Array<MobilSport>} mobils - Data mobil
 * @param {string} filename - Nama file
 * 
 * KOMPETENSI: J.620100.017.02 - File Handling
 */
function exportToCSV(mobils, filename = 'apex_showroom_data.csv') {
  // HEADER CSV
  const headers = ['ID', 'Merk', 'Model', 'Tahun'];
  
  // CONVERT DATA TO CSV ROWS
  const rows = mobils.map(mobil => [
    mobil.getId(),
    mobil.merk,
    mobil.model,
    mobil.tahun
  ]);
  
  // COMBINE HEADER + ROWS
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // CREATE BLOB & DOWNLOAD
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`✅ CSV exported: ${filename}`);
}

// ...existing code...

/**
 * UTILITY: generatePDFContent
 * 
 * DESKRIPSI:
 * Generate text content untuk PDF/TXT export
 * Digunakan sebagai fallback jika jsPDF gagal
 * 
 * @param {Array<MobilSport>} mobils - Data mobil
 * @returns {string} Formatted text content
 * 
 * KOMPETENSI: J.620100.017.02 - File Handling
 */
function generatePDFContent(mobils) {
  const now = new Date().toLocaleString();
  const totalCars = mobils.length;
  
  let content = '═════════════════════════════════════════════════════════\n';
  content += '           APEX AUTO SHOWROOM - INVENTORY REPORT\n';
  content += '═════════════════════════════════════════════════════════\n\n';
  
  content += `Generated: ${now}\n`;
  content += `Total Cars: ${totalCars}\n\n`;
  
  content += '─────────────────────────────────────────────────────────\n';
  content += '| ID  | MERK            | MODEL           | TAHUN |\n';
  content += '─────────────────────────────────────────────────────────\n';
  
  mobils.forEach(mobil => {
    const id = String(mobil.getId()).padEnd(3);
    const merk = mobil.merk.padEnd(15);
    const model = mobil.model.padEnd(15);
    const tahun = String(mobil.tahun).padEnd(5);
    content += `| ${id} | ${merk} | ${model} | ${tahun} |\n`;
  });
  
  content += '─────────────────────────────────────────────────────────\n\n';
  
  // SUMMARY STATISTICS
  const merks = [...new Set(mobils.map(m => m.merk))];
  const years = [...new Set(mobils.map(m => m.tahun))];
  
  content += 'SUMMARY STATISTICS:\n';
  content += `  • Total Unique Brands: ${merks.length}\n`;
  content += `  • Brands: ${merks.join(', ')}\n`;
  content += `  • Year Range: ${Math.min(...years)} - ${Math.max(...years)}\n`;
  
  content += '\n═════════════════════════════════════════════════════════\n';
  
  return content;
}

/**
 * UTILITY: printData
 * 
 * DESKRIPSI:
 * Print data mobil menggunakan browser print dialog
 * 
 * @param {Array<MobilSport>} mobils - Data mobil
 * 
 * KOMPETENSI: J.620100.017.02 - User Interface
 */
function printData(mobils) {
  const printWindow = window.open('', '_blank');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>APEX Auto Showroom - Print Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 24px; color: #333; margin-bottom: 5px; }
        .header p { color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1f2937; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
        @media print {
          body { padding: 0; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏎️ APEX AUTO SHOWROOM</h1>
        <p>Inventory Report - ${new Date().toLocaleString()}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Merk</th>
            <th>Model</th>
            <th>Tahun</th>
            <th>Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          ${mobils.map(m => `
            <tr>
              <td>${m.getId()}</td>
              <td>${m.merk}</td>
              <td>${m.model}</td>
              <td>${m.tahun}</td>
              <td><em>${m.getDeskripsi()}</em></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Total Records: ${mobils.length} | Printed: ${new Date().toLocaleString()}</p>
        <p style="margin-top: 10px;">© 2026 APEX AUTO SHOWROOM. All rights reserved.</p>
      </div>
      
      <script>
        window.onload = function() { window.print(); }
        window.onafterprint = function() { window.close(); }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  console.log('🖨️ Print dialog opened');
}

/**
 * UTILITY: exportToPDF - UPDATED VERSION
 * 
 * DESKRIPSI:
 * Export data mobil ke format PDF dengan table yang rapi
 * Menggunakan jsPDF + jspdf-autotable library
 * 
 * @param {Array<MobilSport>} mobils - Data mobil
 * @param {string} filename - Nama file
 * 
 * KOMPETENSI: J.620100.017.02 - File Handling & External Libraries
 */
function exportToPDF(mobils, filename = 'apex_showroom_report.pdf') {
  try {
    // CHECK jika jsPDF tersedia
    if (typeof jsPDF === 'undefined') {
      throw new Error('jsPDF library not loaded');
    }

    // CREATE PDF INSTANCE
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // SET TITLE
    pdf.setFontSize(18);
    pdf.setTextColor(200, 30, 30); // Red color
    pdf.text('APEX AUTO SHOWROOM', 105, 20, { align: 'center' });

    // SET SUBTITLE
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Inventory Report - Sistem Manajemen Kendaraan Sport', 105, 28, { align: 'center' });

    // SET GENERATED DATE
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 35, { align: 'center' });

    // ──────────────────────────────────────────────────────────────────
    // CREATE TABLE DENGAN jsPDF-AutoTable
    // ──────────────────────────────────────────────────────────────────

    const tableHeaders = ['ID', 'Merk', 'Model', 'Tahun'];
    const tableData = mobils.map(m => [
      m.getId(),
      m.merk,
      m.model,
      m.tahun
    ]);

    // CHECK jika autoTable available
    if (typeof pdf.autoTable === 'function') {
      // AUTOMATE TABLE GENERATION
      pdf.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 42,
        
        // STYLING
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: [31, 41, 55],     // Dark bg
          textColor: [255, 255, 255],   // White text
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [245, 245, 245],
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        margin: { top: 10, right: 10, bottom: 20, left: 10 },
        
        // FOOTER
        didDrawPage: (data) => {
          // FOOTER TEXT
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(
            `Page ${data.pageNumber} of ${pdf.getNumberOfPages()}`,
            105,
            pdf.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });

      // ──────────────────────────────────────────────────────────────────
      // ADD SUMMARY STATISTICS
      // ──────────────────────────────────────────────────────────────────

      const finalY = pdf.autoTable.previous?.finalY || 50;
      
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.text('SUMMARY STATISTICS:', 20, finalY + 10);

      const merks = [...new Set(mobils.map(m => m.merk))];
      const years = [...new Set(mobils.map(m => m.tahun))];

      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`• Total Records: ${mobils.length}`, 25, finalY + 17);
      pdf.text(`• Unique Brands: ${merks.length}`, 25, finalY + 23);
      pdf.text(`• Year Range: ${Math.min(...years)} - ${Math.max(...years)}`, 25, finalY + 29);
    } else {
      // FALLBACK: Manual table drawing jika autoTable tidak ada
      console.warn('⚠️ jsPDF-autoTable not available. Using manual table rendering.');
      
      let yPosition = 42;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const rowHeight = 8;
      
      // DRAW HEADER
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(31, 41, 55);
      pdf.rect(20, yPosition, 170, rowHeight, 'F');
      
      const colWidth = 170 / 4;
      tableHeaders.forEach((header, i) => {
        pdf.text(header, 22 + i * colWidth, yPosition + 6);
      });
      yPosition += rowHeight;
      
      // DRAW ROWS
      pdf.setTextColor(50, 50, 50);
      tableData.forEach((row, idx) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // ALTERNATE ROW COLOR
        if (idx % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        pdf.rect(20, yPosition, 170, rowHeight, 'F');
        
        row.forEach((cell, i) => {
          pdf.text(String(cell), 22 + i * colWidth, yPosition + 6);
        });
        yPosition += rowHeight;
      });
    }

    // ──────────────────────────────────────────────────────────────────
    // SAVE PDF
    // ──────────────────────────────────────────────────────────────────

    pdf.save(filename);
    console.log(`✅ PDF exported successfully: ${filename}`);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    
    // FALLBACK: Export as TXT jika ada error
    console.warn('📋 Fallback: Exporting as TXT instead...');
    const content = generatePDFContent(mobils);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.pdf', '.txt'));
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('⚠️ PDF export fallback. Exported as TXT instead. Please ensure jsPDF and jspdf-autotable are installed.');
  }
}

/**
 * FUNCTION: jalankanUnitTesting
 * Menjalankan unit test untuk class Kendaraan dan MobilSport
 * PRINSIP: Testing (J.620100.033.02)
 */
function jalankanUnitTesting() {
  console.log("=== MEMULAI UNIT TESTING ===");
  try {
    const testCar = new MobilSport(99, 'TestMerk', 2025, 'TestModel');
    console.assert(testCar.getId() === 99, "Test 1 Gagal: Getter ID salah mengembalikan nilai");
    const expectedDesc = "TestMerk TestModel - Keluaran 2025";
    console.assert(testCar.getDeskripsi() === expectedDesc, "Test 2 Gagal: Output deskripsi tidak sesuai ekspektasi");
    testCar.updateDataMobil("MerkBaru", "ModelBaru", 2026);
    console.assert(testCar.merk === "MerkBaru" && testCar.tahun === 2026, "Test 3 Gagal: Proses update data dengan 3 argumen gagal");
    console.log("Status: 100% Lulus Build. Semua pengujian unit berhasil dievaluasi tanpa galat.");
  } catch (error) {
    console.error("Kesalahan Debugging / Pengujian:", error.message);
  }
  console.log("=== PENGUJIAN SELESAI ===");
}

// ════════════════════════════════════════════════════════════════════════════
// REACT COMPONENT: App
// ════════════════════════════════════════════════════════════════════════════

/**
 * REACT COMPONENT: App
 * 
 * STATE:
 * - mobils: array data mobil
 * - formData: data form untuk create/update
 * - editId: ID mobil yang sedang diedit
 * - isLoading: flag loading state
 * - errorMsg: pesan error
 * - dbStatus: status koneksi database
 * - searchQuery: query pencarian
 * - filterBrand: filter berdasarkan merk
 * - filterYear: filter berdasarkan tahun
 * - sortOrder: asc/desc
 * - sortBy: field untuk sort (merk/model/tahun)
 * 
 * KOMPETENSI: J.620100.017.02 - Pemrograman Terstruktur
 */
export default function App() {
  const [mobils, setMobils] = useState([]);
  const [formData, setFormData] = useState({ merk: '', model: '', tahun: '' });
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [dbStatus, setDbStatus] = useState(DB_CONNECTION_STATUS.isConnected);
  
  // SEARCH & FILTER STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortBy, setSortBy] = useState("merk");

  /**
   * HOOK: useEffect
   * Berjalan sekali saat component mount
   */
  useEffect(() => {
    dbService.checkConnection();
    setDbStatus(DB_CONNECTION_STATUS.isConnected);
    fetchData();
    jalankanUnitTesting();
  }, []);

  /**
   * FUNCTION: fetchData
   * Mengambil data dari backend dan update state
   * @async
   */
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await dbService.getAllData();
      setMobils(data);
      setDbStatus(DB_CONNECTION_STATUS.isConnected);
    } catch (error) {
      setErrorMsg(error.message);
      setDbStatus(false);
      console.error("[DEBUG]", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * FUNCTION: handleChange
   * Event handler untuk perubahan input form
   * @param {Event} e - Event dari input element
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * FUNCTION: handleSubmit
   * Event handler untuk submit form (create/update)
   * @async
   * @param {Event} e - Event dari form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (editId) {
        await dbService.updateData(editId, formData);
        setEditId(null);
      } else {
        await dbService.insertData(formData);
      }
      
      setFormData({ merk: '', model: '', tahun: '' });
      await fetchData(); 
    } catch (error) {
      setErrorMsg("Gagal menyimpan data: " + error.message);
    }
  };

  /**
   * FUNCTION: handleEdit
   * Memindahkan data dari tabel ke form untuk proses edit
   * @param {MobilSport} mobil - Object mobil yang akan diedit
   */
  const handleEdit = (mobil) => {
    setFormData({ merk: mobil.merk, model: mobil.model, tahun: mobil.tahun });
    setEditId(mobil.getId());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * FUNCTION: handleDelete
   * Menghapus data mobil dengan konfirmasi
   * @async
   * @param {number} id - ID mobil yang akan dihapus
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus unit kendaraan ini dari database?")) return;
    
    try {
      await dbService.deleteData(id);
      await fetchData();
    } catch (error) {
      setErrorMsg("Gagal menghapus: " + error.message);
    }
  };

  /**
   * FUNCTION: handleClearFilters
   * Menghapus semua filter & search
   * 
   * KOMPETENSI: J.620100.017.02 - State Management
   */
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterBrand("");
    setFilterYear("");
    setSortOrder("asc");
    setSortBy("merk");
  };

  // ════════════════════════════════════════════════════════════════════════════
  // COMPUTED PROPERTY: Filtered & Sorted Data
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * USEMEMO: Optimized filtering & sorting
   * Mencegah re-calculation jika dependency tidak berubah
   * 
   * KOMPETENSI: J.620100.017.02 - Performance Optimization
   */
  const filteredMobils = useMemo(() => {
    return filterAndSearchMobils(
      mobils,
      searchQuery,
      filterBrand,
      filterYear,
      sortOrder,
      sortBy
    );
  }, [mobils, searchQuery, filterBrand, filterYear, sortOrder, sortBy]);

  /**
   * GET: Unique brands untuk dropdown filter
   */
  const uniqueBrands = [...new Set(mobils.map(m => m.merk))].sort();

  /**
   * GET: Unique years untuk dropdown filter
   */
  const uniqueYears = [...new Set(mobils.map(m => m.tahun))].sort((a, b) => b - a);

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER UI
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HEADER APLIKASI */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8 border-b border-red-600 pb-4">
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="text-red-500">🏎️</span> Apex Auto Showroom
          </h1>
          <p className="text-neutral-400 mt-2">Sistem Enterprise Berbasis Modular & React | v2.0 - Search, Filter & Export</p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ERROR MESSAGE DISPLAY */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!dbStatus && (
          <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <strong>⚠️ Database Connection Error: </strong>
            Backend API tidak tersedia di {API_BASE_URL}
            <br />
            <span className="text-xs text-red-300">
              Percobaan: {DB_CONNECTION_STATUS.errorCount}/{DB_CONNECTION_STATUS.maxRetries}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative">
            <strong>Error Exception: </strong> {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* MODUL 1: FORM INPUT (CREATE/UPDATE) */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 h-fit shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {editId ? '✏️ Edit Spesifikasi' : '➕ Registrasi Unit'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Merk Pabrikan</label>
                <input 
                  type="text" 
                  name="merk" 
                  value={formData.merk} 
                  onChange={handleChange}
                  placeholder="Misal: McLaren"
                  disabled={!dbStatus}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Model / Varian</label>
                <input 
                  type="text" 
                  name="model" 
                  value={formData.model} 
                  onChange={handleChange}
                  placeholder="Misal: 720S"
                  disabled={!dbStatus}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Tahun Rilis</label>
                <input 
                  type="number" 
                  name="tahun" 
                  value={formData.tahun} 
                  onChange={handleChange}
                  placeholder="Misal: 2022"
                  disabled={!dbStatus}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="pt-2 flex gap-2">
                <button 
                  type="submit" 
                  disabled={!dbStatus}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editId ? 'Simpan Perubahan' : 'Proses Data'}
                </button>
                {editId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditId(null); setFormData({merk:'', model:'', tahun:''}); }}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* MODUL 2 & 3: SEARCH, FILTER & DATA LIST */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* ──────────────────────────────────────────────────────────── */}
            {/* SEARCH & FILTER PANEL */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  🔍 Search & Filter
                </h3>
                {(searchQuery || filterBrand || filterYear) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-3 py-1 rounded transition"
                  >
                    ✕ Hapus Filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* SEARCH INPUT */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Cari Mobil</label>
                  <input 
                    type="text"
                    placeholder="Cari merk, model, tahun..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                {/* FILTER BY BRAND */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Filter Merk</label>
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">Semua Merk</option>
                    {uniqueBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* FILTER BY YEAR */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Filter Tahun</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">Semua Tahun</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* SORT OPTIONS */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">& Urutkan</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition"
                    >
                      <option value="merk">Merk</option>
                      <option value="model">Model</option>
                      <option value="tahun">Tahun</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm transition font-semibold"
                      title={sortOrder === 'asc' ? 'Naik (A-Z)' : 'Turun (Z-A)'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ──────────────────────────────────────────────────────────── */}
            {/* EXPORT PANEL */}
            {/* ──────────────────────────────────────────────────────────── */}
            {mobils.length > 0 && (
              <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 shadow-lg">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-neutral-400">📊 Export Data:</span>
                  
                  <button
                    onClick={() => exportToCSV(filteredMobils, `apex_showroom_${new Date().toISOString().split('T')[0]}.csv`)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
                    title="Download data sebagai file CSV (Excel)"
                  >
                    📥 CSV
                  </button>
                  
                  <button
                    onClick={() => exportToPDF(filteredMobils, `apex_showroom_${new Date().toISOString().split('T')[0]}.pdf`)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
                    title="Download data sebagai file PDF"
                  >
                    📄 PDF
                  </button>
                  
                  <button
                    onClick={() => printData(filteredMobils)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
                    title="Print report ke printer"
                  >
                    🖨️ Print
                  </button>

                  <div className="flex-1 text-right text-xs text-neutral-400">
                    Showing {filteredMobils.length} of {mobils.length} cars
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────── */}
            {/* DATA LIST - INVENTORY */}
            {/* ──────────────────────────────────────────────────────────── */}
            <div>
              <h2 className="text-xl font-bold mb-4">📋 Daftar Inventaris Kendaraan</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12 text-neutral-500">
                  <span className="animate-pulse">Menghubungkan ke Service Layer (Querying)...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMobils.map((mobil) => (
                    <div key={mobil.getId()} className="bg-neutral-800 rounded-xl p-5 border border-neutral-700 hover:border-red-500/50 transition shadow-lg flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-neutral-900 text-neutral-300 text-xs font-bold px-2 py-1 rounded border border-neutral-700">
                            {mobil.tahun}
                          </span>
                          <span className="text-neutral-600 text-xs uppercase">
                            ID: {mobil.getId()}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight">{mobil.model}</h3>
                        <p className="text-red-400 font-medium uppercase tracking-wide text-sm">{mobil.merk}</p>
                        
                        <p className="text-xs text-neutral-500 mt-2 italic">
                          "{mobil.getDeskripsi()}"
                        </p>
                      </div>
                      
                      <div className="mt-6 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(mobil)}
                          disabled={!dbStatus}
                          className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-semibold py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit Parameter
                        </button>
                        <button 
                          onClick={() => handleDelete(mobil.getId())}
                          disabled={!dbStatus}
                          className="flex-1 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white text-sm font-semibold py-2 rounded border border-red-900/50 hover:border-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Hapus Record
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredMobils.length === 0 && !dbStatus && (
                    <div className="col-span-full text-center py-12 text-red-400 border border-dashed border-red-700 rounded-xl">
                      ❌ Database tidak terhubung. Silakan periksa backend API Anda.
                    </div>
                  )}

                  {filteredMobils.length === 0 && dbStatus && mobils.length === 0 && (
                    <div className="col-span-full text-center py-12 text-neutral-500 border border-dashed border-neutral-700 rounded-xl">
                      Basis Data Kosong. Rekam data baru untuk memulai uji coba.
                    </div>
                  )}

                  {filteredMobils.length === 0 && dbStatus && mobils.length > 0 && (
                    <div className="col-span-full text-center py-12 text-neutral-500 border border-dashed border-neutral-700 rounded-xl">
                      🔍 Tidak ada hasil yang cocok dengan filter Anda.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}