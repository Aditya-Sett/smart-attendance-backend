const express = require('express');
const router = express.Router();
const { login } = require('../controllers/Auth_Controller');

router.post('/login', login);

module.exports = router;
