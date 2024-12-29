import express from 'express';
import authMiddleware from '../middleware/auth.js'
const router = express.Router();

// 보호된 라우트
router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Hello, user with ID: ${req.user.id}` });
});

export default router; // ESM 방식
