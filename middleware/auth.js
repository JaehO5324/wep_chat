import jwt from 'jsonwebtoken';
const JWT_SECRET = 'your_jwt_secret_key';

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
	console.log("디코딩된 토큰:", decoded);
    req.user = decoded; // 사용자 정보를 요청 객체에 추가
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
	console.error("JWT 인증 실패:", err);
  }
};

export default authMiddleware; // default로 내보내기
