const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 보호된 라우트
router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Hello, user with ID: ${req.user.id}` });
});

module.exports = router;
