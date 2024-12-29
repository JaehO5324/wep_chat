// 클라이언트와 서버 간의 WebSocket 설정
const socket = io();
  auth: {
    token: getCookie('authToken'), // 쿠키에서 JWT 토큰 가져오기
  },
});
// DOM Elements
const usernameInput = document.getElementById('username-input');
const joinChatButton = document.getElementById('join-chat');
const chatWindow = document.getElementById('chat-window');
const messageBox = document.getElementById('message-box');
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');
const authContainer = document.getElementById('auth-container');//로그인 화면
const chatApp = document.getElementById('chat-app');// 채팅화면
// 사용자 이름
let username = localStorage.getItem('username');

// 쿠키에서 값 가져오기
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// 초기 렌더링
window.onload = () => {
  const token = getCookie('authToken');
  if (token) {
    // 로그인 상태인 경우 채팅 화면 표시
    showChatApp();
  } else {
    // 로그인 상태가 아닌 경우 로그인 화면 표시
    showLoginScreen();
  }
};

// 로그인 요청
async function login(username, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || 'Login failed');
      return;
    }

    const data = await response.json();
    alert('Login successful!');
    showChatApp(); // 채팅 화면 표시
  } catch (err) {
    console.error('Error during login:', err);
    alert('An error occurred. Please try again.');
  }
}

// 로그인 화면 표시
function showLoginScreen() {
  authContainer.classList.remove('hidden'); // 로그인 화면 표시
  chatApp.classList.add('hidden'); // 채팅 화면 숨김
}

// 메시지 전송 처리
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat message', { message }); // 서버로 메시지 전송
    messageInput.value = ''; // 입력 필드 초기화
  } else {
    alert('Please type a message!');
  }
});

// 서버에서 기존 메시지 로드
socket.on('load messages', (messages) => {
  messages.forEach((msg) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
    messagesDiv.appendChild(messageElement);
  });
});

// 서버에서 새 메시지 수신
socket.on('chat message', (data) => {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // 스크롤 자동 하단 이동
});

// 회원 가입 요청 처리
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        alert('Sign-up successful! Please log in.');
        window.location.href = '/login.html';
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Sign-up failed');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    }
  });
}

// 로그인 요청 처리
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Login failed');
        return;
      }

      alert('Login successful!');
      showChatApp(); // 채팅 화면 표시
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    }
  });
}

// 로그아웃 처리
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .then(() => {
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login.html';
      });
  });
}