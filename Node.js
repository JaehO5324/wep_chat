// 설치 명령: npm install express socket.io
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const mongoose = require('mongoose');


// 정적 파일 제공 (프론트엔드 파일 경로)
app.use(express.static('public'));

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

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

mongoose.connect('mongodb+srv://toywogh:wogh0324@jaeho.ik5s5.mongodb.net/?retryWrites=true&w=majority&appName=jaeho')
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
