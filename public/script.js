// 클라이언트와 서버 간의 WebSocket 설정
const socket = io();

// DOM Elements
const usernameInput = document.getElementById('username-input');
const joinChatButton = document.getElementById('join-chat');
const chatWindow = document.getElementById('chat-window');
const messageBox = document.getElementById('message-box');
const sendButton = document.getElementById('send-button');
const messagesDiv = document.getElementById('messages');
const userInfo = document.getElementById('user-info');
const authContainer = document.getElementById('auth-container');//로그인 화면
const chatApp = document.getElementById('chat-app');// 채팅화면
// 사용자 이름
let username = localStorage.getItem('username');

// 로컬 저장소에서 로그인 상태 확인
const token = localStorage.getItem('authToken');


localStorage.setItem('authToken', data.token); // 서버가 토큰을 반환한다고 가정
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
  authContainer.classList.remove('hidden'); // 로그인 화면 표시
  chatApp.classList.add('hidden'); // 채팅 화면 숨김
}

// 채팅 화면 표시
function showChatApp() {
  authContainer.classList.add('hidden'); // 로그인 화면 숨김
  chatApp.classList.remove('hidden'); // 채팅 화면 표시
}

// 채팅 메시지 전송 처리
sendButton?.addEventListener('click', () => {
  const message = messageBox.value.trim();

  if (message) {
    socket.emit('chat message', { user: username, message });
    messageBox.value = ''; // 입력 필드 초기화
  }
});

// 서버에서 메시지 수신
socket.on('chat message', (data) => {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  if (data.user === username) {
    messageElement.classList.add('me');
  }
  messageElement.innerHTML = `<strong>${data.user}:</strong> ${data.message}`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // 스크롤 자동 하단 이동
});

// 회원 가입 요청 처리
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지

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
        alert(data.message); // 회원 가입 성공 메시지 표시
        window.location.href = '/login.html'; // 로그인 페이지로 이동
      } else {
        alert(data.message); // 오류 메시지 표시
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
        localStorage.setItem('authToken', data.token); // 사용자 이름 저장
        alert('Login successful!'); // 로그인 성공 메시지 표시
        showChatApp();// 채팅 페이지로 이동
      } else {
        alert(data.message || 'Login failed'); // 오류 메시지 표시
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    }
  });
}

// 로그아웃 처리
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('username');
    window.location.href = '/login.html'; // 로그인 페이지로 이동
  });
}