
console.log('START HISTORY ROUTE');

const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/HistoryController');

// History page routes
router.get('/:raceid', HistoryController.init);
router.get('/:raceid/:sessionid', HistoryController.init);

// API routes
router.post('/api/result', HistoryController.getResult);
router.post('/api/personal', HistoryController.getPersonal);
router.get('/api/sessions/:raceid', HistoryController.getSessionList);

module.exports = router;
