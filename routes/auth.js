import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';

const router = express.Router(); // router 선언
const JWT_SECRET = 'your_jwt_secret_key'; // JWT 비밀 키

// 회원 가입
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // 비밀번호 암호화
      const hashedPassword = await bcryptjs.hash(password, 10);

      // 새 사용자 생성
      const user = new User({ username, password: hashedPassword });
      await user.save();

      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// 로그인
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ message: 'Wrong User ID' });
      }

      // 비밀번호 확인
      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Wrong password' });
      }

      // JWT 토큰 생성
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

      // 쿠키에 토큰 저장 (옵션 포함)
      res.cookie('token', token, {
        httpOnly: true, // 클라이언트에서 쿠키 접근 불가
        secure: process.env.NODE_ENV === 'production', // HTTPS에서만 사용
        sameSite: 'strict', // CSRF 보호
      });

      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

export default router; // default export 추가
