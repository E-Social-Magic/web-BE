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
  function (err, req, res, next) {
    console.log(req.message);
    res.status(400).json({
      success: req.isAuthenticated(),
      err: err.message
    });
  },
);

router.get('/login/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

//router login fb
router.get('/login/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    res.redirect('/');
  });

router.post('/verify', userController.createAccount);

router.get('/sendmail_forget',
  function (req, res, next) {
    res.json({ err: undefined });
  });

router.post('/sendmail_forget', userController.sendmailFogot);

router.post('/new_password', userController.updatePassword);

//router logout
router.get('/logout',
  function (req, res) {
    req.logout();
    res.status(200).json({ success: true, msg: 'Logout success' });
  });

// router.get('/posts', listPost)
// router.get('/post/:id', detailPost)
// router.post('/post/new', userController.checkAuthenticated, createPost)
// router.put('/post/:id/edit', userController.checkAuthenticated, editPost)
// router.delete('/post/:id', userController.checkAuthenticated, deletePost)

export default router;
