let username = ''; // 사용자 이름 저장

let token = localStorage.getItem('authToken');// 가짜 토큰 저장소 (실제 구현에서는 로컬 스토리지나 세션 사용)

// DOM Elements
const usernameInput = document.getElementById('username-input');
const joinChatButton = document.getElementById('join-chat');
const chatWindow = document.getElementById('chat-window');
const messageBox = document.getElementById('message-box');
const sendButton = document.getElementById('send-button');
const messagesDiv = document.getElementById('messages');
const userInfo = document.getElementById('user-info');


// 초기 렌더링
window.onload = () => {
  if (token) {
    // 로그인 상태인 경우 채팅 화면 표시
    showChatApp();
  } else {
    // 로그인 상태가 아닌 경우 로그인 화면 표시
    showLoginScreen();
  }
};

// 로그인 화면 표시
function showLoginScreen() {
  authContainer.classList.remove('hidden');
  chatApp.classList.add('hidden');
}

// 채팅 화면 표시
function showChatApp() {
  authContainer.classList.add('hidden');
  chatApp.classList.remove('hidden');
}

// 로그인 폼 처리
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      // 로그인 성공 - 토큰 저장 및 화면 전환
      token = data.token;
      localStorage.setItem('authToken', token);
      showChatApp();
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('An error occurred. Please try again.');
  }
});

// 로그아웃 처리
function logout() {
  localStorage.removeItem('authToken');
  token = null;
  showLoginScreen();
}


// Join chat event
joinChatButton.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (username) {
    userInfo.style.display = 'none';
    chatWindow.classList.remove('hidden');
  } else {
    alert('Please enter your name to join the chat.');
  }
});

// Dummy users for demo
const users = ['User 1', 'User 2', 'User 3'];

// Add users to the list
users.forEach(user => {
  const li = document.createElement('li');
  li.textContent = user;
  userList.appendChild(li);
});


// 사용자 이름 입력 처리
document.getElementById('username-form').addEventListener('submit', (event) => {
  event.preventDefault();
  username = document.getElementById('username-input').value.trim();

  if (username) {
    document.getElementById('username-modal').style.display = 'none'; // 사용자 이름 입력 UI 숨기기
  }
});

// Socket.IO 연결
const socket = io();

// 서버에서 이전 메시지 로드
socket.on('load messages', (messages) => {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = ''; // 기존 메시지 초기화
  messages.forEach((msg) => {
    displayMessage(msg); // 메시지 표시
  });
});

// 새로운 메시지 수신
socket.on('chat message', (msg) => {
  displayMessage(msg); // 메시지 표시
});

// 메시지 표시 함수
function displayMessage(msg) {
  const messagesDiv = document.getElementById('messages');
  const newMessage = document.createElement('div');
  newMessage.className = 'message';

  // 사용자 이름 표시
  const user = document.createElement('strong');
  user.textContent = `${msg.user}: `;
  newMessage.appendChild(user);

  // 메시지 내용 표시
  const text = document.createElement('span');
  text.textContent = msg.message;
  newMessage.appendChild(text);

  messagesDiv.appendChild(newMessage);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // 스크롤을 가장 아래로 이동
}

//회원 가입 요청
document.getElementById('signup-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      alert('Sign up successful! You can now log in.');
      window.location.href = 'login.html';
    } else {
      alert(data.message || 'Sign up failed');
    }
  } catch (err) {
    console.error('Sign up error:', err);
    alert('An error occurred. Please try again.');
  }
});
//로그인
document.getElementById('login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      alert('Login successful!');
      window.location.href = 'index.html'; // 로그인 후 채팅 페이지로 이동
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('An error occurred. Please try again.');
  }
});


// 메시지 전송
document.getElementById('send-button').addEventListener('click', () => {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();

  if (message && username) {
    socket.emit('chat message', { user: username, message }); // 사용자 이름과 메시지 전송
    messageInput.value = ''; // 입력 필드 초기화
  }
});

// Enter 키로 메시지 전송
document.getElementById('message-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('send-button').click();
  }
});
