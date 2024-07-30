const express = require('express');
const router = express.Router();
const apiCheckController = require('../controllers/apiCheckController');

router.get('/', apiCheckController.handleApiCheck);

module.exports = router;