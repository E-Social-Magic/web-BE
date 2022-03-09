import express from 'express';
const router = express.Router();
import passport from '../config/passport.js';
import * as userController from '../app/http/controllers/user.js';
import * as postController from '../app/http/controllers/post.js';
import * as commentController from '../app/http/controllers/comment.js';
import * as subjectController from '../app/http/controllers/subject.js';
import * as groupController from '../app/http/controllers/group.js';
import * as privateDataController from '../app/http/controllers/private_data.js';
import verifyToken from '../app/http/middlewares/auth.js';
import auth from './auth.js';
import jwt from 'jsonwebtoken';
const { TOKEN_KEY } = env;
import env from '../config/config.js';


router.get('/signup',
  function (req, res, next) {
    res.json({ title: "Create Account", err: undefined });
  });
router.post('/signup', userController.userValidator, userController.signup);

router.get('/user/info', [userController.info]);

router.get('/users', verifyToken, [userController.getAllUser]);

router.post('/login', auth);

router.get('/login/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    res.status(200).json({ success: true, message: 'Login success' });
  });

//router login fb
router.get('/login/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    res.status(200).json({ success: true, message: 'Login success' });
  });

router.post('/verify', userController.createAccount);

router.get('/sendmail_forget',
  function (req, res, next) {
    res.json({ err: undefined });
  });

router.post('/sendmail_forget', userController.sendmailFogot);
router.post('/sendmail_forget/confirm', userController.updatePassword);

//router logout
router.post('/logout', (req, res) => {
  return res.status(200).json("Logged out successfully!");
});

router.get('/posts', postController.listPost);
router.get('/post/:id', postController.detailPost);
router.get('/post/:id/vote', verifyToken, postController.vote);
router.post('/post/new', verifyToken, postController.createPost);
router.post('/post/newAnonymously', verifyToken, postController.createPostAnonymously);
router.put('/post/:id/edit', verifyToken, postController.editPost);
router.delete('/post/:id', verifyToken, postController.deletePost);


router.put('/post/:id/comment', verifyToken, commentController.createComment);
router.put('/post/:id/comment/:commentId/edit', verifyToken, commentController.editComment);
router.delete('/post/:id/comment/:commentId', verifyToken, commentController.deleteComment);

router.put('/subject/join', verifyToken, subjectController.createSubject);
router.put('/subject/:id/edit', verifyToken, subjectController.editSubject);
router.delete('/subject/:id', verifyToken, subjectController.deleteSubject);

router.get('/groups', groupController.listGroup);
router.get('/group/:id', groupController.detailGroup);
router.post('/group/new', verifyToken, groupController.createGroup);
router.put('/group/:id/edit', verifyToken, groupController.editGroup);
router.delete('/group/:id', verifyToken, groupController.deleteGroup);

router.get('/private_datas', privateDataController.listPrivateData);
router.get('/private_data/:id', privateDataController.deletePrivateData);
router.post('/private_data/new', verifyToken, privateDataController.createPrivateData);
router.put('/private_data/:id/edit', verifyToken, privateDataController.editPrivateData);
router.delete('/private_data/:id', verifyToken, privateDataController.deletePrivateData);

export default router;
