import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const app = express();

app.use(express.json()); // JSON 형식의 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 본문 파싱

//디버깅용
const inputPassword = 'hahaha'; // 입력된 비밀번호
const storedHash = '$2a$10$tQa/4pQtpoXKnceXhwDf.e6ZL90n6OfxN8gaTpW1XmhvUTTRGyXhe'; // 저장된 해시
const password = 'wogh0324';
const debugHash = '$2a$10$RxoftyoBDV6xO0I1ydjtcOy5y6KvEVL/P3hrfmQ9425ee1A7EWEwC';
const DebugMatch = await bcryptjs.compare(password, debugHash);
console.log('Comparison result:', DebugMatch);
const hashedPassword = '';


(async () => {
  const isMatch = await bcryptjs.compare(inputPassword, storedHash);
  console.log('비교 결과:', isMatch);
})();


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
	console.log('req.body:', req.body);

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
      console.log('암호=', password);

    if (!hashedPassword.startsWith('$2a$')) {
  hashedPassword = await bcryptjs.hash(password, 10);
  console.log(hashedPassword, password);
}

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
	console.log('Validation errors:', errors.array());
	console.log('Received username:', req.body.username);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      console.log("User attempting to login:", username);
process.stdout.write(`User attempting to login: ${username}\n`);
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
const newHash = await bcryptjs.hash(password, 10);
console.log('새로운 해시:', newHash);

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