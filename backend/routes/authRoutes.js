const express = require('express');
const router = express.Router();
const { registerUser, authUser, getTechnicians } = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/technicians', protect, admin, getTechnicians);

module.exports = router;
