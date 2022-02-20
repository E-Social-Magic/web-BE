import express from 'express';
const router = express.Router();

import passport from '../config/passport.js';
import * as userController from '../app/http/controllers/user.js';

// router login
router.get('/', [userController.checkAuthenticated, userController.homepage]);

router.get('/login', [userController.checkNotAuthenticated, userController.login]);

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    res.redirect('/');
  });

//router login gg
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
  passport.authenticate('facebook', { scope: ['email'] }));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    res.redirect('/');
  });

//router signup
router.get('/signup',
  function (req, res, next) {
    res.json({ title: "Create Account", err: undefined });
  });
router.post('/signup', userController.signup);

//router sendemail
router.post('/verify', userController.createAccount);

router.get('/sendmail_forget',
  function (req, res, next) {
    res.json({ title: "Forgot Password", err: undefined });
  });

router.post('/sendmail_forget', userController.sendmailFogot);

router.post('/new_password', userController.updatePassword);

//router logout
router.get('/logout',
  function (req, res) {
    req.logout();
    res.redirect('/login');
  });

export default router;
