import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});



// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (password) {
  return bcryptjs.compare(password, this.password);
};


const User = mongoose.model('User', userSchema);
export default User; // ESM 방식
