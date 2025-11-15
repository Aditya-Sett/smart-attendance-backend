// routes/schedulerRoutes.js
const express = require('express');
const router = express.Router();
const schedulerController =require("../controllers/Scheduler_Controller");
 // Adjust path as needed

// Get scheduler status
router.get('/status', schedulerController.dailyCodeSchedulerStatus )

// Trigger manual cleanup
router.post('/cleanup-now', schedulerController.cleanUpScheduler);

// POST - Stop the scheduler
router.post('/stop', schedulerController.stopScheduler);

// POST - Restart the scheduler
router.post('/restart', schedulerController.restartScheduler);

module.exports = router;