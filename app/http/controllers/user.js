import db from '../../models/index.model.js';
const { User } = db;
import sendMail from '../../../config/sendMail.js';
import bcrypt from 'bcrypt';
import validator from 'express-validator';
const { body, check, validationResult } = validator;
import _ from 'lodash';
var code;

export function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    return res.status(401).send({ success: false, message: 'Authentication failed.' });
}

export function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.json({ success: true, message: 'Logged in' })
    }
    next()
}

export function getAllUser(req, res) {
    User.find({}, (err, users) => {
        if (err) { return res.json({ err }) }
        return res.json({ users: users })
    })
}

export function info(req, res) {
    const {password,...user} = req.user._doc;
    return res.json(user);
};

export function login(req, res) {
    return res.json({ title: 'Login to Account' })
};

export const userValidator = [
    body('username')
        .not().isEmpty().withMessage('Username is required.')
        .isLength({ min: 5 }).withMessage('Username must not be empty and must be at least 5 chars.'),
    body('email')
        .trim().isLength({ min: 1 }).escape().withMessage('Email must not be empty.')
        .isEmail().withMessage('Invalid email'),
    body('password')
        .notEmpty().withMessage('Password must not be empty')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    check('confirm_password', 'Passwords do not match')
        .exists().custom((value, { req }) => value === req.body.password),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // console.log(errors);
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
]

export function signup(req, res, next) {
    User.findOne({
        $or: [{ email: req.body.email }, { username: req.body.username }]
    })
        .then(result => {
            if (result) {
                return res.json({ success: false, message: 'Username already exists.' });
            }
            else {
                code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
                var subject = "Email for verify"
                var view = "<h2>Hello</h2><p>This is code for verify your account: " + code + " </p>";
                sendMail(req.body.email, subject, view);
                return res.status(200).json( req.body )
            }
        })
        .catch(err => {
            console.log(err);
        })
}

export function createAccount(req, res, next) {
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
                sendMail(req.body.email, subject, view);
                return res.json({ success: true, message: 'Successful created new user.' });
            });
        })
    }
    else {
        return res.json({ account: req.body, err: 'Incorrect code' })
    }
}

export const sendmailFogot = [
    body('email').trim().isLength({ min: 1 }).escape().withMessage('Email must not be empty.')
        .withMessage('Email has non-alphanumeric characters.'),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.json({ account: req.body, errors: errors.array() });
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
<<<<<<< HEAD
                        sendMail(req.body.email, subject, view);
                        return res.json({email: result.email, message: "Check code in your email"})
=======
                        // sendMail(req.body.email, subject, view);
                        return res.json(result.email, {message: "Check code in your email"})
>>>>>>> 5844ae0 (Done subject)
                    }
                    else {
                        return res.json({ err: 'The email does not exist' })
                    }
                }
                )

        }
    }
];

export function updatePassword(req, res, next) {
    if (req.body.code == code && req.body.confirm == req.body.password) {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            User.findOneAndUpdate( {email: req.body.email}, { $set: { password: hash } }, function (err) {
                if (err) { return next(err); }
                return res.json({success: true, message: "Changed password"});

            });
        })
    }
    else {
        return res.json({ err: 'Incorrect code or password' })
    }
};

