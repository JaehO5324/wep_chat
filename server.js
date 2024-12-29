import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 메시지 스키마 정의
const messageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// 유저 스키마 정의
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token; // 쿠키에서 JWT 추출
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // 인증된 사용자 정보 저장
    next();
  });
};

// 회원 가입
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error registering user' });
  }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 로그아웃
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logout successful' });
});

// 인증된 사용자 정보 제공
app.get('/api/protected', authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

// WebSocket 인증
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.user = user;
    next();
  });
});

// WebSocket 이벤트 처리
io.on('connection', async (socket) => {
  console.log('A user connected:', socket.user.username);

  // 이전 메시지 로드
  try {
    const messages = await Message.find().populate('user', 'username').sort({ timestamp: 1 });
    socket.emit('load messages', messages);
  } catch (err) {
    console.error('Error loading messages:', err);
  }

  // 메시지 저장 및 브로드캐스트
  socket.on('chat message', async (data) => {
    const message = {
      user: socket.user.id,
      username: socket.user.username,
      message: data.message,
      timestamp: new Date(),
    };

    try {
      const newMessage = new Message(message);
      await newMessage.save();

      io.emit('chat message', message);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.user.username);
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
