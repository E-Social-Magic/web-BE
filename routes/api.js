import express from 'express';
const router = express.Router();
import passport from '../config/passport.js';
import * as userController from '../app/http/controllers/user.js';

router.get('/signup',
  function (req, res, next) {
    res.json({ title: "Create Account", err: undefined });
  });
router.post('/signup', userController.userValidator, userController.signup );

router.get('/', [userController.checkAuthenticated, userController.homepage]);

router.get('/login', [userController.checkNotAuthenticated, userController.login]);

router.post('/login',
  function (req, res) {
    console.log(req.user);
    res.json({success: true, msg: 'Login success'});
  });

export default router;
