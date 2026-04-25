const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const produkRoute = require('./routes/produk');

const app = express();
const PORT = process.env.PORT || 5002;

// MIDDLEWARE

// CORS - Izinkan akses dari frontend
app.use(cors({
  origin: 'http://localhost:5173', // Adjust sesuai port Vite kamu
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Philips Electronics Store API is running',
    timestamp: new Date().toISOString()
  });
});

// Produk routes
app.use('/', produkRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '❌ Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ERROR HANDLER
app.use((error, req, res, next) => {
  console.error('❌ Unhandled Error:', error);
  res.status(500).json({
    success: false,
    message: '❌ Internal server error',
    error: error.message
  });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`
 
  ║   ⚡ PHILIPS ELECTRONICS STORE - BACKEND API v2.0        
  ║                                                          
  ║   Server running on: http://localhost:${PORT}              
  ║   Database: philips_electronics_db                        
  ║                                                            
  ║   📊 API Endpoints:                                       
  ║   - GET    /produk                  (All products)        
  ║   - GET    /produk/:id              (Get by ID)           
  ║   - POST   /produk                  (Create)              
  ║   - PUT    /produk/:id              (Update)              
  ║   - DELETE /produk/:id              (Delete)                                    
  
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});