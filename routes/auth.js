import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

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
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        console.log(`Username "${username}" already exists.`);
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }

      // 비밀번호 암호화
      const hashedPassword = await bcryptjs.hash(password, 10);

      // 새 사용자 생성
      const user = new User({ username, password: hashedPassword });
      await user.save();

      res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
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
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      console.log("User attempting to login:", username);

      const user = await User.findOne({ username });
      if (!user) {
        console.log(`Login failed. User "${username}" does not exist.`);
        return res.status(400).json({ success: false, message: 'Wrong User ID' });
      }

      if (!user.password) {
        console.log(`User "${username}" does not have a password stored.`);
        return res.status(400).json({ success: false, message: 'Invalid password configuration' });
      }

      // 비밀번호 확인
      const isMatch = await bcryptjs.compare(password, user.password);
	  //디버깅
	  console.log(`Password comparison for user "${username}":`, {
  inputPassword: password,
  storedPassword: user.password,
  comparisonResult: isMatch,
});

console.log('입력된 비밀번호:', password);
console.log('저장된 비밀번호 해시:', user.password);
      if (!isMatch) {
        console.log(`Login failed. Incorrect password for user "${username}".`);
        return res.status(400).json({ success: false, message: 'Wrong password' });
      }

      // JWT 토큰 생성
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

      // 쿠키에 토큰 저장
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({ success: true, message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
);

export default router;