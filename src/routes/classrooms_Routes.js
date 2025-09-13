const express = require('express');
const router = express.Router();
const { 
    create,
    details
 } = require('../controllers/classrooms_Controller');

router.post('/create', create);
router.get('/details', details);

module.exports = router;
