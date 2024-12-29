import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
const app = express();
const onlineUsers = new Map(); // 사용자 ID와 이름을 저장
const corsOptions = {
  origin: 'https://wep-chat.onrender.com', // 클라이언트의 URL
  credentials: true, // 쿠키 허용
};
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(cors(corsOptions));
dotenv.config();


const server = http.createServer(app);
const io = new Server(server);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// MongoDB 설정
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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


// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};


// 인증 상태 확인을 위한 라우트
app.get('/api/protected', authenticateToken, (req, res) => {
  // JWT가 유효하면 사용자 정보를 반환
  res.status(200).json({ user: req.user });
});

// 로그인 라우트
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 3600000 });
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// 로그아웃 라우트
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// WebSocket 설정
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.user.username);

  // 사용자 정보 저장
  onlineUsers.set(socket.id, socket.user);

  // 사용자 목록 업데이트
  const users = Array.from(onlineUsers.values());
  io.emit('update user list', users);

  // 클라이언트로부터 메시지 수신
 // 기존 메시지 로드 및 전송
  Message.find()
    .sort({ timestamp: 1 })
    .then((messages) => {
      socket.emit('load messages', messages);
    })
    .catch((err) => console.error('Error loading messages:', err));

   // 메시지 로드
  Message.find()
    .sort({ timestamp: 1 })
    .then((messages) => socket.emit('load messages', messages))
     .catch((err) => console.error('Error loading messages:', err));
  // 메시지 전송
  socket.on('chat message', async (data) => {
    const newMessage = new Message({
      username: socket.username,
      message: data.message,
    });
    await newMessage.save();
    io.emit('chat message', {
        username: newMessage.username,
        message: newMessage.message,
        timestamp: newMessage.timestamp,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // 사용자 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.user.username);
    onlineUsers.delete(socket.id); // 사용자 제거
    const users = Array.from(onlineUsers.values());
    io.emit('update user list', users); // 사용자 목록 업데이트
  });
});


// 서버 실행
server.listen(3000, () => console.log('Server is running on http://localhost:3000'));
