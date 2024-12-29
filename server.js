const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const router = express.Router();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const User = require('./models/User'); // User 모델 가져오기
const cookieParser = require('cookie-parser');//?

const authRoutes = require('./routes/auth'); // 회원 가입 및 로그인 라우트
const protectedRoutes = require('./routes/protected'); // 보호된 라우트


app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // 정적 파일 제공



//유저 정보 스키마
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model('users', userSchema);
// MongoDB 연결
mongoose.connect('mongodb+srv://toywogh:wogh0324@jaeho.ik5s5.mongodb.net/?retryWrites=true&w=majority&appName=jaeho', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes); // 회원 가입 및 로그인 관련 라우트
app.use('/api', protectedRoutes); // 보호된 라우트

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
   
     //새로운 사용자 생성
   const user = new User({ username, password: hashedPassword });
  
 //사용자 저장  
  await user.save();
    re
	s.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error registering user' });
  }
});




app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: req.body.username });
if (!user) {
  return res.status(404).json({ message: '사용자가 존재하지 않습니다.' });
}

const isMatch = await user.comparePassword(req.body.password);
if (!isMatch) {
  return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
}
    const token = jwt.sign({ id: user._id, username: user.username }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
  // 성공 응답
  res.json({ success: true, token });
});

// 메시지 스키마 정의
const messageSchema = new mongoose.Schema({
  user: String, // 사용자 이름
  message: String, // 메시지 내용
  timestamp: { type: Date, default: Date.now }, // 메시지 시간
});

const Message = mongoose.model('Message', messageSchema);

// 정적 파일 제공
app.use(express.static('public'));

// WebSocket 처리
io.on('connection', async (socket) => {
  console.log('A user connected');

  // 이전 메시지 로드
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit('load messages', messages);
  } catch (err) {
    console.error('Error loading messages:', err);
  }

  // 새 메시지 저장 및 전송
  socket.on('chat message', async (data) => {
    try {
      const newMessage = new Message({
        user: data.user, // 사용자 이름
        message: data.message, // 메시지 내용
      });
      await newMessage.save();
      io.emit('chat message', newMessage); // 모든 클라이언트에 메시지 전송
    } catch (err) {
      console.error('Error saving message:', err);
    }
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
