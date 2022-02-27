import express from 'express';
const router = express.Router();
import passport from '../config/passport.js';
import * as userController from '../app/http/controllers/user.js';

router.get('/signup',
  function (req, res, next) {
    res.json({ title: "Create Account", err: undefined });
  });
router.post('/signup', userController.userValidator, userController.signup);

router.get('/', [userController.checkAuthenticated, userController.homepage]);

router.get('/login', [userController.checkNotAuthenticated, userController.login]);

router.post('/login',
  passport.authenticate('json-custom', { failWithError: true }),
  function (req, res) {
    res.status(200).json({ success: true, msg: 'Login success' });
  },
  function(err, req, res, next) {
    console.log(req.message);
    res.status(400).json({
      success: req.isAuthenticated(),
      err: err.message
    });
  },
  );

export default router;
