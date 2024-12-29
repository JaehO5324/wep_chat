// WebSocket 설정
const socket = io({
  auth: {
    token: getCookie('authToken'),
  },
});

// DOM Elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesDiv = document.getElementById('messages');
const logoutButton = document.getElementById('logout-button');
const authContainer = document.getElementById('auth-container');
const chatApp = document.getElementById('chat-app');

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
    showChatApp();
  } else {
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

// 메시지 전송
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat message', { message });
    messageInput.value = '';
  } else {
    alert('Please type a message!');
  }
});

// 서버에서 메시지 로드
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
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// 로그아웃 처리
logoutButton.addEventListener('click', () => {
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    .then(() => {
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login.html';
    });
});
