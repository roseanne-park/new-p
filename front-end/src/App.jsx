/**
 * MODUL: ANTARMUKA PENGGUNA - PHILIPS ELECTRONICS INVENTORY
 * File: src/App.jsx
 * Author: Puput Suyaningtyas
 * Tanggal: April 2026
 * * DESKRIPSI:
 * Sistem manajemen inventaris produk elektronik Philips.
 */

import React, { useState, useEffect, useMemo } from 'react';

const API_BASE_URL = 'http://localhost:5002';

// FLAG STATUS KONEKSI DATABASE
let DB_CONNECTION_STATUS = {
  isConnected: false,
  lastAttempt: null,
  errorCount: 0,
  maxRetries: 3
};

// OOP CLASSES

/**
 * CLASS: Produk
 * Base class untuk entitas produk elektronik.
 */
class Produk {
  #id;
  
  constructor(id, nama, kategori, harga, stok, deskripsi) {
    this.#id = id;
    this.nama = nama;
    this.kategori = kategori;
    this.harga = harga;
    this.stok = stok;
    this.deskripsi = deskripsi || "";
  }
  
  getId() { return this.#id; }
  
  getFormattedHarga() {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(this.harga);
  }

  getStatusStok() {
    if (this.stok <= 0) return "Habis";
    if (this.stok < 5) return "Hampir Habis";
    return "Tersedia";
  }
}

/**
 * CLASS: ProdukDatabaseService
 * Service layer untuk operasi CRUD produk.
 */
class ProdukDatabaseService {
  async checkConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/produk`, { method: 'GET' });
      DB_CONNECTION_STATUS.isConnected = response.ok;
      return response.ok;
    } catch (error) {
      DB_CONNECTION_STATUS.isConnected = false;
      return false;
    }
  }
  
  async getAllData() {
    try {
      const response = await fetch(`${API_BASE_URL}/produk`);
      if (!response.ok) throw new Error("Gagal mengakses API");
      const result = await response.json();
      DB_CONNECTION_STATUS.isConnected = true;
      return result.data.map(item => new Produk(
        item.id, 
        item.nama, 
        item.kategori, 
        item.harga, 
        item.stok, 
        item.deskripsi
      ));
    } catch (error) {
      DB_CONNECTION_STATUS.isConnected = false;
      throw new Error("Koneksi Database Terputus: " + error.message);
    }
  }
  
  async insertData(data) {
    const response = await fetch(`${API_BASE_URL}/produk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Gagal menambah produk");
    }
    return await response.json();
  }
  
  async updateData(id, data) {
    const response = await fetch(`${API_BASE_URL}/produk/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal memperbarui data");
    return await response.json();
  }
  
  async deleteData(id) {
    const response = await fetch(`${API_BASE_URL}/produk/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("Gagal menghapus data");
    return true;
  }
}

const dbService = new ProdukDatabaseService();

// EXPORT UTILITIES

const exportToPDF = (items, filename = 'philips_inventory_report.pdf') => {
  if (!window.jspdf) {
    alert("Library PDF (jsPDF) sedang dimuat atau gagal dimuat. Silakan coba lagi dalam beberapa detik.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 71, 187); // Philips Blue
  doc.text('PHILIPS ELECTRONICS INVENTORY', 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

  const tableColumn = ["ID", "Nama Produk", "Kategori", "Harga", "Stok"];
  const tableRows = [];

  items.forEach(item => {
    const itemData = [
      item.getId(),
      item.nama,
      item.kategori,
      item.getFormattedHarga(),
      item.stok
    ];
    tableRows.push(itemData);
  });

  // Check if autoTable is available
  if (doc.autoTable) {
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [0, 71, 187] }
    });
  } else {
    // Fallback if autotable fails
    doc.text("Data table rendering failed (autoTable not found).", 15, 40);
  }

  doc.save(filename);
};

const exportToCSV = (items, filename = 'philips_inventory.csv') => {
  const headers = ["ID", "Nama", "Kategori", "Harga", "Stok", "Deskripsi"];
  const csvContent = [
    headers.join(","),
    ...items.map(item => [
      item.getId(),
      `"${item.nama}"`,
      item.kategori,
      item.harga,
      item.stok,
      `"${item.deskripsi.replace(/"/g, '""')}"`
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// REACT COMPONENT: App

export default function App() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ 
    nama: '', 
    deskripsi: '', 
    kategori: 'Television', 
    harga: '', 
    stok: '' 
  });
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // FILTER STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState("");

  const categories = ['Television', 'Audio', 'Lighting', 'Appliances', 'Health', 'Accessories'];

  useEffect(() => {
    // Dynamic loading of external scripts to avoid build resolution errors
    const loadScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    };

    const initScripts = async () => {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
    };

    initScripts();
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getAllData();
      setItems(data);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const payload = {
        ...formData,
        harga: parseInt(formData.harga),
        stok: parseInt(formData.stok)
      };

      if (editId) {
        await dbService.updateData(editId, payload);
        setEditId(null);
      } else {
        await dbService.insertData(payload);
      }
      
      setFormData({ nama: '', deskripsi: '', kategori: 'Television', harga: '', stok: '' });
      fetchData();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus produk ini?")) return;
    try {
      await dbService.deleteData(id);
      fetchData();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nama: item.nama,
      deskripsi: item.deskripsi,
      kategori: item.kategori,
      harga: item.harga,
      stok: item.stok
    });
    setEditId(item.getId());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKategori = filterKategori === "" || item.kategori === filterKategori;
      return matchSearch && matchKategori;
    });
  }, [items, searchQuery, filterKategori]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-700 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">P</span> 
              Philips Inventory
            </h1>
            <p className="text-slate-500 font-medium">Sistem Manajemen Elektronik Modular</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => exportToPDF(filteredItems)}
              className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition font-semibold text-sm shadow-sm"
            >
              PDF
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-sm flex justify-between items-center animate-in fade-in duration-300">
            <span><strong>Error:</strong> {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="font-bold hover:text-red-900 transition">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM PANEL */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 h-fit sticky top-8">
            <h2 className="text-xl font-bold mb-6 text-slate-700 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              {editId ? 'Edit Parameter Produk' : 'Registrasi Produk Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Produk</label>
                <input 
                  type="text" 
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="Contoh: Philips Ambilight OLED"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                <select 
                  value={formData.kategori}
                  onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Harga (Rp)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.harga}
                    onChange={(e) => setFormData({...formData, harga: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stok</label>
                  <input 
                    type="number" 
                    required
                    value={formData.stok}
                    onChange={(e) => setFormData({...formData, stok: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deskripsi Produk</label>
                <textarea 
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none h-28 resize-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Masukkan spesifikasi teknis..."
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-200 active:scale-[0.98]"
                >
                  {editId ? 'Update Informasi' : 'Submit ke Database'}
                </button>
                {editId && (
                  <button 
                    type="button"
                    onClick={() => { setEditId(null); setFormData({nama:'', deskripsi:'', kategori:'Television', harga:'', stok:''}); }}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* LIST PANEL */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SEARCH & FILTER BAR */}
            <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                <input 
                  type="text"
                  placeholder="Cari ID, Nama, atau Deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="w-full md:w-auto">
                <select 
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* PRODUCT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {isLoading ? (
                <div className="col-span-full py-32 text-center">
                   <div className="inline-block w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-slate-400 font-medium">Synchronizing with Cloud Database...</p>
                </div>
              ) : filteredItems.map((item) => (
                <div key={item.getId()} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-2xl transition-all relative overflow-hidden group hover:-translate-y-1">
                  {/* Status Badge */}
                  <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl shadow-sm ${
                    item.getStatusStok() === 'Tersedia' ? 'bg-emerald-500 text-white' : 
                    item.getStatusStok() === 'Hampir Habis' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {item.getStatusStok()}
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">{item.kategori}</span>
                    <h3 className="text-xl font-bold text-slate-800 mt-3 line-clamp-1 group-hover:text-blue-700 transition-colors">{item.nama}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 h-10 mt-2 leading-relaxed">{item.deskripsi || "Informasi deskripsi belum ditambahkan untuk produk ini."}</p>
                  </div>

                  <div className="flex justify-between items-end mt-6 pt-6 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valuasi Pasar</p>
                      <p className="text-xl font-black text-slate-900">{item.getFormattedHarga()}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.stok > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <p className="text-xs font-bold text-slate-600">{item.stok} Unit Tersedia</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Edit Record"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(item.getId())}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Hapus Record"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!isLoading && filteredItems.length === 0 && (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Data tidak ditemukan dalam sistem</p>
                  <p className="text-slate-300 text-sm mt-1">Gunakan kata kunci lain atau registrasi unit baru.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* FOOTER INFO */}
      <footer className="mt-16 text-center border-t border-slate-200 pt-8 pb-12">
        <div className="flex justify-center gap-4 mb-4">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-blue-200 rounded-full"></span>
        </div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; 2026 Philips Global Inventory System | Engineering Division
        </p>
      </footer>
    </div>
  );
}