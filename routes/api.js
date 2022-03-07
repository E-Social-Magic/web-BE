import express from 'express';
const router = express.Router();
import passport from '../config/passport.js';
import * as userController from '../app/http/controllers/user.js';
import * as postController from '../app/http/controllers/post.js';
import * as commentController from '../app/http/controllers/comment.js';
import * as subjectController from '../app/http/controllers/subject.js';
import * as groupController from '../app/http/controllers/group.js';
import * as privateDataController from '../app/http/controllers/private_data.js';


router.get('/signup',
  function (req, res, next) {
    res.json({ title: "Create Account", err: undefined });
  });
router.post('/signup', userController.userValidator, userController.signup);

router.get('/user/info', [userController.checkAuthenticated, userController.info]);

router.get('/login', [userController.checkNotAuthenticated, userController.login]);

router.get('/users', [userController.checkAuthenticated, userController.getAllUser]);

router.post('/login',
  passport.authenticate('json-custom', { failWithError: true }),
  function (req, res) {
    res.status(200).json({ success: true, message: 'Login success' });
  },
  function (err, req, res, next) {
    console.log(req.message);
    res.status(200).json({
      success: req.isAuthenticated(),
      message: err.message
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
    res.status(200).json({ success: true, message: 'Logout success' });
  });

router.get('/posts', postController.listPost);
router.get('/post/:id', postController.detailPost);
router.put('/post/:id/comment', userController.checkAuthenticated, commentController.createComment);
router.put('/post/:id/comment/:commentId/edit', userController.checkAuthenticated, commentController.editComment);
router.delete('/post/:id/comment/:commentId', userController.checkAuthenticated, commentController.deleteComment);
router.post('/post/new', userController.checkAuthenticated, postController.createPost);
router.post('/post/newAnonymously', userController.checkAuthenticated, postController.createPostAnonymously);
router.put('/post/:id/edit', userController.checkAuthenticated, postController.editPost);
router.delete('/post/:id', userController.checkAuthenticated, postController.deletePost);

// router.get('/comments', commentController.checkPostExist, commentController.listComment);
// router.get('/comment/:id', commentController.detailComment);
// router.post('/comment/new', userController.checkAuthenticated, commentController.createComment);
// router.put('/comment/:id/edit', userController.checkAuthenticated, commentController.editComment);
// router.delete('/comment/:id', userController.checkAuthenticated, commentController.deleteComment);

router.get('/subjects', subjectController.listSubject);
router.get('/subject/:id', subjectController.detailSubject);
router.post('/subject/new', userController.checkAuthenticated, subjectController.createSubject);
router.put('/subject/:id/edit', userController.checkAuthenticated, subjectController.editSubject);
router.delete('/subject/:id', userController.checkAuthenticated, subjectController.deleteSubject);

router.get('/groups', groupController.listGroup);
router.get('/group/:id', groupController.detailGroup);
router.post('/group/new', userController.checkAuthenticated, groupController.createGroup);
router.put('/group/:id/edit', userController.checkAuthenticated, groupController.editGroup);
router.delete('/group/:id', userController.checkAuthenticated, groupController.deleteGroup);

router.get('/private_datas', privateDataController.listPrivateData);
router.get('/private_data/:id', privateDataController.deletePrivateData);
router.post('/private_data/new', userController.checkAuthenticated, privateDataController.createPrivateData);
router.put('/private_data/:id/edit', userController.checkAuthenticated, privateDataController.editPrivateData);
router.delete('/private_data/:id', userController.checkAuthenticated, privateDataController.deletePrivateData);

export default router;
