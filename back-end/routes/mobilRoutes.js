// ============================================================================
// MODUL: PENGATUR RUTE (ROUTER)
// File: routes/mobilRoutes.js
// ============================================================================

const express = require('express');
const router = express.Router();
const MobilController = require('../controllers/MobilController');

// Mendaftarkan End-points (Rute) API
router.get('/', MobilController.getAll);           // GET /mobil
router.post('/', MobilController.create);          // POST /mobil
router.put('/:id', MobilController.update);        // PUT /mobil/:id
router.delete('/:id', MobilController.delete);     // DELETE /mobil/:id

module.exports = router;