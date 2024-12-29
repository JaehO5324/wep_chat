// 설치 명령: npm install express socket.io mongoose
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일 제공 (프론트엔드 파일 경로)
app.use(express.static('public'));

// WebSocket 연결 처리
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    // 모든 클라이언트로 메시지 브로드캐스트
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// MongoDB 연결
const MONGO_URI = 'mongodb+srv://toywogh:wogh0324@jaeho.ik5s5.mongodb.net/?retryWrites=true&w=majority&appName=jaeho';
try {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB Atlas');
} catch (err) {
  console.error('MongoDB connection error:', err);
}