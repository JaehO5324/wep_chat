let username = ''; // 사용자 이름 저장

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
