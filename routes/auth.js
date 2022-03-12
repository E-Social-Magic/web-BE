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
    const { username, password } = req.body;
    if (!(username && password)) {
      return res.status(HTTPStatus.BAD_REQUEST).send({
        message:
          'All input is required. Please input username, password,email'
      });
    }
    const oldUser = await User.findOne({ username });
    if (oldUser && (await bcrypt.compare(password, oldUser.password))) {
      if(oldUser.visible == -1){
        return res.status(HTTPStatus.OK).json({message:"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với Quản trị viên để biết thêm thông tin"});
      }
      const token = jwt.sign({ user_id: oldUser._id, username, role:oldUser.role }, TOKEN_KEY, {
        algorithm: 'HS384',
        expiresIn: '2h',
      });
      const {email,name,subjects,role,createdAt,updatedAt,id}= oldUser
      
      return res.status(HTTPStatus.OK).json({email,username,name,subjects,role,createdAt,updatedAt,id,token});
    } 
    return res.status(HTTPStatus.OK).json({message:"User name or password not correct"});
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
