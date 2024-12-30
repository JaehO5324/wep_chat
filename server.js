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
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 사용자 스키마
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// 메시지 스키마
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// 루트 경로 처리
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 로그인 라우터
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 로그아웃 라우터
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.status(200).json({ message: 'Logged out successfully' });
});

// WebSocket 인증
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Invalid token'));
    socket.username = user.username;
    next();
  });
});

// WebSocket 이벤트
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username}`);

 // 메시지 로드
  Message.find()
    .sort({ timestamp: 1 })
    .then((messages) => {
      socket.emit('load messages', messages); // 기존 메시지를 로드
    })
    .catch((err) => console.error('Error loading messages:', err));

  // 클라이언트에서 메시지 전송 이벤트 처리
  socket.on('chat message', async (data) => {
    try {
      const newMessage = new Message({
        username: socket.username || 'Anonymous', // WebSocket 인증에서 가져온 사용자 이름
        message: data.message,
      });

      await newMessage.save(); // 메시지 저장

      // 모든 클라이언트에 메시지 전송
      io.emit('chat message', {
        username: newMessage.username,
        message: newMessage.message,
        timestamp: newMessage.timestamp,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });


  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
