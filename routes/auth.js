import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import HTTPStatus from 'http-status';
import cookieSession from 'cookie-session';
import User from '../app/models/user.js';
import env from '../config/config.js';
import passport from '../config/passport.js';
const { TOKEN_KEY } = env;
const router = Router();
router.use(
  cookieSession({
    name: 'project',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: ['key1', 'key2'],
  })
);

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      return res.status(HTTPStatus.BAD_REQUEST).send({
        message:
          'Vui lòng không để trống thông tin đăng nhập! Bao gồm Email và Password!'
      });
    }
    const oldUser = await User.findOne({ email });
    if (oldUser && (await bcrypt.compare(password, oldUser.password))) {
      if(oldUser.blocked == true){
        return res.status(HTTPStatus.OK).json({message:"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với Quản trị viên để biết thêm thông tin"});
      }
      const token = jwt.sign({ user_id: oldUser._id, username: oldUser.username, role:oldUser.role }, TOKEN_KEY, {
        algorithm: 'HS384',
        expiresIn: '2h',
      });
      const {username,role,createdAt,updatedAt,id}= oldUser
      
      return res.status(HTTPStatus.OK).json({email,username,role,id,token});
    } 
    return res.status(HTTPStatus.OK).json({message:"Thông tin đăng nhập không chính xác! Hãy kiểm tra lại Username hoặc Password"});
  } catch (err) {
    return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json(err.message);
  }
}
);

const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    return res.status(HTTPStatus.UNAUTHORIZED).redirect('/login');
  }
};

router.get('/login/failed', (req, res) =>
  res
    .status(HTTPStatus.UNAUTHORIZED)
    .json({ message: 'Login with is failed!' })
);

router.post('/logout', (req, res) => {
  res.status(200).json("Logged out successfully!");
});

export default router;
