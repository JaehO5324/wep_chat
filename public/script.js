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

// 메시지 전송 처리
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();

  if (message) {
    // WebSocket을 통해 서버로 메시지 전송
    socket.emit('chat message', { message });

    // 클라이언트에 메시지 표시
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'me');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);

    // 메시지 입력창 초기화
    messageInput.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // 스크롤 하단 이동
  } else {
    alert('Please type a message!');
  }
});

// 서버에서 메시지 수신
socket.on('chat message', (data) => {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  if (data.username === socket.username) {
    messageElement.classList.add('me');
  }
  messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // 스크롤 하단 이동
});

// 로그아웃 처리
logoutButton.addEventListener('click', () => {
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    .then(() => {
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login.html';
    });
});
