const express = require('express');
const router = express.Router();
const { addSchedule, getScheduleByDepartment } = require('../controllers/Schedule_Controller');

router.post('/', addSchedule);
router.get('/:department', getScheduleByDepartment);

module.exports = router;
