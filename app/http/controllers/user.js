import db from '../../models/index.model.js';
const {User} = db;
import sendMail from '../../../config/sendMail.js';
import bcrypt from 'bcrypt';
import { check, body, validationResult } from 'express-validator';
import storage from 'node-persist';
var code;

export function checkAuthenticated (req, res, next){
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

export function checkNotAuthenticated (req, res, next){
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

export function homepage (req, res){
    storage.setItem('role', req.user.role)
    return res.json({ title: 'Homepage', username: req.user.username, role: req.user.role });
};

export function login (req, res) {
    return res.json({ title: 'Login to Account' })
};

export const signup = [
    body('username')
        .trim().isLength({ min: 1 }).escape().withMessage('Username must not be empty.')
        .isAlphanumeric().withMessage('Username has non-alphanumeric characters.'),
    body('email')
        .trim().isLength({ min: 1 }).escape().withMessage('Email must not be empty.')
        .withMessage('Email has non-alphanumeric characters.'),
    // check('email')
    //     .isEmail()
    //     .withMessage('Invalid Email')
    //     .custom((value, { req }) => {
    //         return new Promise((resolve, reject) => {
    //             User.findOne({ email: req.body.email }, function (err, user) {
    //                 if (Boolean(user)) {
    //                     reject(new Error('E-mail already in use'))
    //                 }
    //                 resolve(true)
    //             });
    //         });
    //     }),
    body('password')
        .notEmpty().withMessage('Password must not be empty')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    check('confirm_password', 'Passwords do not match')
        .exists().custom((value, { req }) => value === req.body.password),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // console.log(errors);
            res.json({ title: 'Create Account', account: req.body, errors: errors.array() });
            return;
        }
        else {
            User.findOne({
                $or: [{ email: req.body.email }, { username: req.body.username }]
            })
                .then(result => {
                    if (result) {
                        res.json({ title: 'Create Account', err: 'The username or email does exist' })
                    }
                    else {
                        code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
                        var subject = "Email for verify"
                        var view = "<h2>Hello</h2><p>This is code for verify your account: " + code + " </p>";
                        // mailer.sendMail(req.body.email, subject, view);
                        console.log(code);
                        res.json({ title: 'Verify Account', account: req.body, err: undefined })
                    }
                })
                .catch(err => {
                    console.log(err);
                })

        }
    }
]

export function createAccount (req, res, next) {
    if (req.body.code == code) {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            var user = new User(
                {
                    username: req.body.username,
                    email: req.body.email,
                    password: hash,
                    role: "user"
                });
            user.save(function (err) {
                if (err) {
                    return next(err);
                }
                var subject = "Notice of successful registrationThanks "
                var view = "<h2>Welcome</h2><p>You have successfully registered</p>";
                // mailer.sendMail(req.body.email, subject, view);
                res.redirect("/login");
            });
        })
    }
    else {
        res.json({ title: 'Verify Account', account: req.body, err: 'Incorrect code' })
    }
}

export const sendmailFogot = [
    body('email').trim().isLength({ min: 1 }).escape().withMessage('Email must not be empty.')
        .withMessage('Email has non-alphanumeric characters.'),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.json({ title: 'Create Account', account: req.body, errors: errors.array() });
            return;
        }
        else {

            User.findOne({
                email: req.body.email
            })
                .then(result => {
                    if (result) {
                        code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
                        var subject = "Email forgot password"
                        var view = "<h2>Hello</h2><p>This is code for reset password: " + code + " </p>";
                        // mailer.sendMail(req.body.email, subject, view);
                        res.json({ title: 'Verify Account', account: result, err: undefined })
                    }
                    else {
                        res.json({ title: 'Forgot Password', err: 'The email does not exist' })
                    }
                }
                )

        }
    }
];

export function updatePassword (req, res, next) {
    if (req.body.code == code && req.body.confirm == req.body.password) {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            User.findByIdAndUpdate(req.body.id, { $set: { password: hash } }, {}, function (err) {
                if (err) { return next(err); }
                res.redirect("/login");
            });
        })
    }
    else {
        res.json({ title: 'Verify Account', account: req.body, err: 'Incorrect code or password' })
    }
};

