import db from '../../models/index.model.js';
const { User } = db;
import sendMail from '../../../config/sendMail.js';
import bcrypt from 'bcryptjs';
import validator from 'express-validator';
const { body, check, validationResult } = validator;
import _ from 'lodash';
import multer from 'multer';
import { storageImages } from '../../../config/multer.js';
const uploadImage = multer({
    storage: storageImages,
    fileFilter: (req, file, cb) => {
        if ((file.mimetype).includes('jfif') || (file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});
var code;

export async function getAllUser(req, res) {
    if (req.user.role == "admin") {
        const users = await User.find({}, { password: 0 })
        return res.json({ users: users });
    }
    return res.status(403).json({ success: false, message: "No permission!" });
}

export function info(req, res) {
    const { password, ...user } = req.user._doc;
    return res.json(user);
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
                return res.status(200).json(req.body)
            }
        })
        .catch(err => {
            console.log(err);
        })
}

export const createAccount = [
    uploadImage.single("avatarP"),
    async (req, res, next) => {
        if (req.body.code == code) {
            bcrypt.hash(req.body.password, 10, function (err, hash) {
                var user = new User(
                    {
                        username: req.body.username,
                        email: req.body.email,
                        password: hash,
                        level: req.body.level,
                        avatar: req.protocol + "://" + req.headers.host + req.file.path.replace("public", ""),
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
    }]

export const editAccount = [
    uploadImage.single("avatarP"),
    async (req, res) => {
        try {
            const data = req.body;
            data.avatar = req.protocol + "://" + req.headers.host + req.file.path.replace("public", "");
            const user = await User.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user.user_id },
                data,
                { returnOriginal: false }
            );
            if (user)
                return res.json({ user, message: 'User was updated successfully.' });
            return res.status(403).json({
                message: `Cannot update user with id=${req.params.id}. Maybe user was not found or No permission!`,
            });
        } catch (error) {
            return res.status(500).json({
                message: `Error: ${error}`,
            });
        }
    }
]

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
                        sendMail(req.body.email, subject, view);
                        return res.json({ email: result.email, message: "Check code in your email" })
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
            User.findOneAndUpdate({ email: req.body.email }, { $set: { password: hash } }, function (err) {
                if (err) { return next(err); }
                return res.json({ success: true, message: "Changed password" });

            });
        })
    }
    else {
        return res.json({ err: 'Incorrect code or password' })
    }
};

export const blockUser = async (req, res, next) => {
    try {
        if (req.user.role == "admin") {
            const { visible } = req.body;
            const user = await User.findOneAndUpdate(
                { _id: req.params.id },
                { visible },
                { returnOriginal: false }
            );
            if (user)
                return res.json({ user, message: 'User was blocked successfully.' });
        }
        return res.status(403).json({
            message: `Cannot blocked user with id=${req.params.id}. Maybe user was not found or No permission!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}