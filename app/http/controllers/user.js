import db from '../../models/index.model.js';
const { User, Post, Payment, Payment_out } = db;
import sendMail from '../../../config/sendMail.js';
import bcrypt from 'bcryptjs';
import validator from 'express-validator';
const { body, check, validationResult } = validator;
import mongoose from 'mongoose';
var ObjectId = mongoose.Types.ObjectId;
import _ from 'lodash';
import multer from 'multer';
import { storageImages } from '../../../config/multer.js';
import { generateAvatar } from './generator.js';
import { createPaymentInCoins, createPaymentOutCoins } from './payment.js';
var code;
var success = "Hoàn thành!";
var noPermission = "Không có quyền truy cập!";

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

export const getAllUser = [async (req, res) => {
    const { offset = 1, limit = 10 } = req.query;
    try {
        if (req.query.search && req.user.role == "admin") {
            const users = await User.find({
                $and: [
                    { role: { $ne: "admin" } },
                    {
                        $text: {
                            $search: req.query.search
                        }
                    },
                ],
            },
                { password: 0 }
            )
                .limit(limit * 1)
                .skip((offset - 1) * limit)
                .exec();
            const count = await User.countDocuments();
            users.sort((a, b) => b.updatedAt - a.updatedAt)
            res.json({
                users,
                totalPages: Math.ceil(count / limit),
                currentPage: offset,
                message: success
            });
        }
        else if (req.user.role == "admin") {
            const users = await User.find(
                { role: { $ne: "admin" } },
                { password: 0 }
            )
                .limit(limit * 1)
                .skip((offset - 1) * limit)
                .exec();
            const count = await User.countDocuments();
            users.sort((a, b) => b.updatedAt - a.updatedAt)
            res.json({
                users,
                totalPages: Math.ceil(count / limit),
                currentPage: offset,
                message: success
            });
        } else {
            return res.status(403).json({ message: noPermission });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}]

export const userInfo = async (req, res) => {
    if (req.params.id) {
        const posts = await Post.find({ user_id: req.params.id });
        let sizePosts = posts.length;
        const user = await User.findOne({ _id: req.params.id }, { password: 0, payment_id: 0, role: 0 })
        return res.json({ user: user, sizePosts, message: success });
    }
    else {
        const user = await User.findOne({ _id: req.user.user_id }, { password: 0 });
        const posts = await Post.find({ user_id: req.user.user_id });
        const helped = await Post.find({ "comments.user_id": req.user.user_id, "comments.correct": true });
        const payment = await Payment.find({ user_id: req.user.user_id });
        let sizePosts = posts.length;
        let sizeHelped = helped.length;
        let images = [];
        let videos = [];
        payment.sort((a, b) => b.updatedAt - a.updatedAt);
        posts.map((post) => images.push(...post.images));
        posts.map((post) => videos.push(...post.videos));
        return res.json({ user: user, sizePosts, sizeHelped, payment, images, videos, message: success });

    }
};

export const userInfoForAd = async (req, res) => {
    if (req.user.role == "admin") {
        const user = await User.findOne({ _id: req.params.id }, { password: 0 })
        return res.json({ user: user, message: success });
    }
    return res.status(403).json({ message: noPermission });
};

export const userValidator = [
    body('username')
        .notEmpty().withMessage('Tên người dùng không được để trống.'),
    body('email')
        .not().isEmpty().withMessage('Email không được để trống.')
        .isEmail().withMessage('Không đúng định dạng email.'),
    check('email')
        .isEmail()
        .custom((value, { req }) => {
            return new Promise((resolve, reject) => {
                User.findOne({ email: req.body.email }, function (err, user) {
                    if (Boolean(user)) {
                        reject(new Error('Email đã được sử dụng'))
                    }
                    resolve(true)
                });
            });
        }),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống.')
        .isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu có 6 kí tự'),
    check('confirm', 'Mật khẩu không khớp, vui lòng thử lại')
        .exists().custom((value, { req }) => value === req.body.password),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
]

// export function signup(req, res, next) {
//     User.findOne({
//         $or: [{ email: req.body.email }, { username: req.body.username }]
//     })
//         .then(result => {
//             if (result) {
//                 return res.json({  message: 'Username already exists.' });
//             }
//             else {
//                 code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
//                 var subject = "Email for verify"
//                 var view = "<h2>Hello</h2><p>This is code for verify your account: " + code + " </p>";
//                 sendMail(req.body.email, subject, view);
//                 return res.status(200).json(req.body)
//             }
//         })
//         .catch(err => {
//             console.log(err);
//         })
// }

export const createAccount = [
    uploadImage.single("avatarP"),
    async (req, res, next) => {
        try {
            const users = await User.findOne({
                email: req.body.email
            });
            if (users) {
                return res.json({ message: 'Email đã được sử dụng' })
            }
            else {
                const hash = await bcrypt.hash(req.body.password, 10);
                const user = new User(req.body);
                user.password = hash;
                if (req.file) {
                    user.avatar = req.protocol + "://" + req.headers.host + req.file.path.replace("public", "");
                }
                else {
                    var uppercaseFirstLetter = req.body.username.charAt(0).toUpperCase();
                    user.avatar = req.protocol + "://" + req.headers.host + generateAvatar(uppercaseFirstLetter, "avatarP").replace("./public", "");
                }
                user.role = "user";
                const userAfter = await user.save();
                if (!userAfter) {
                    return res.json({ message: 'Đăng ký không thành công!' });
                }
                else {
                    return res.json({ message: 'Đăng ký thành công!' });

                }
                // var subject = "Notice of successful registrationThanks "
                // var view = "<h2>Welcome</h2><p>You have successfully registered</p>";
                // sendMail(req.body.email, subject, view);
            }
        } catch (error) {
            return res.status(500).json({
                message: `Error: ${error}`,
            });
        }

    }
]

export const editAccount = [
    uploadImage.single("avatarP"),
    async (req, res) => {
        try {
            const { address, phone, description, level } = req.body;
            const avatar = req.file;
            let data = {};
            if (avatar) {
                data.avatar = req.protocol + "://" + req.headers.host + req.file.path.replace("public", "");
            }
            if (address) {
                data.address = req.body.address;
            }
            if (phone) {
                data.phone = req.body.phone;
            }
            if (description) {
                data.description = req.body.description;
            }
            if (level) {
                data.level = req.body.level;
            }
            const user = await User.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user.user_id },
                data,
                { returnOriginal: false }
            );
            if (user)
                return res.json({ user, message: 'Người dùng đã được cập nhật thành công.' });
            return res.status(403).json({
                message: `Không thể cập nhật người dùng. Có thể người dùng không được tìm thấy hoặc Không có quyền!`,
            });
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    }
]

export const sendmailFogot = [
    body('email').trim().isLength({ min: 1 }).escape().withMessage('Email không được để trống').
        isEmail().withMessage('Không đúng định dạng email'),
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
                        var subject = "Email lấy lại mật khẩu"
                        var view = "<h2>Xin chào</h2><p>Đây là code để lấy lại mật khẩu: " + code + " </p>";
                        sendMail(req.body.email, subject, view);
                        return res.json({ email: result.email, message: "Hãy kiểm tra eamil của bạn!" })
                    }
                    else {
                        return res.json({ err: 'Email này chưa đăng ký hoặc không đúng!' })
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
                return res.json({ message: "Đã đổi mật khẩu thành công!" });
            });
        })
    }
    else {
        return res.json({ err: 'Code hoặc mật khẩu không chính xác!' })
    }
};

export const blockUser = async (req, res, next) => {
    try {
        if (req.user.role == "admin") {
            const userId = req.params.id;
            const user = await User.findById(userId);
            if (user.blocked == true) {
                const userUnblock = await User.findByIdAndUpdate(
                    { _id: req.params.id },
                    { blocked: false },
                    { returnOriginal: false }
                );
                return res.json({ blocked: userUnblock.blocked, message: 'Tài khoản đã được mở khóa.' });
            } else {
                const userBlock = await User.findByIdAndUpdate(
                    { _id: req.params.id },
                    { blocked: true },
                    { returnOriginal: false }
                );
                return res.json({ blocked: userBlock.blocked, message: 'Tài khoản đã bị khóa.' });
            }
        }
        return res.status(403).json({
            message: `Không thể chặn người dùng. Có thể người dùng không được tìm thấy hoặc không có quyền!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const markCorrectAnswer = [
    async (req, res, next) => {
        try {
            const commentId = new ObjectId(req.params.commentId);
            const checkCorrect = await Post.findById(req.params.id);
            if (checkCorrect.comments.find(v => v.correct == true)) {
                return res.json({ message: "Đã đánh dấu 1 câu trả lời đúng trước đó!" })
            }
            else if (checkCorrect.user_id === req.user.user_id) {
                const post = await Post.findByIdAndUpdate(
                    { _id: req.params.id },
                    {
                        $set: {
                            "comments.$[id].correct": true,
                        }
                    },
                    { passRawResult: true, arrayFilters: [{ "id._id": commentId }], returnOriginal: false }
                );

                const { user_id } = post.comments.find(v => v.correct == true);
                const owner = await User.findById({ _id: post.user_id });
                const helper = await User.findById({ _id: user_id });
                const coinsOfOwner = owner.coins + ((10 / 100) * post.coins);
                const coinsOfHelper = helper.coins + (post.coins - ((10 / 100) * post.coins));
                req.owner = {}
                req.owner.user_id = post.user_id
                req.owner.username = owner.username
                req.owner.amount = coinsOfOwner
                req.owner.resultCode = 0
                req.helper = {}
                req.helper.user_id = user_id
                req.helper.username = helper.username
                req.helper.amount = coinsOfHelper
                req.helper.resultCode = 0
                if (post)
                    next()
                // return res.json({ owner: owner.coins, helper: helper.coins, message: 'Đánh dấu câu trả lời đúng thành công!' });
            }
            else {
                return res.status(403).json({
                    message: `Không thể đánh dấu câu trả lời đúng. Có thể không tìm thấy bài đăng hoặc Không có quyền!`,
                });
            }
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    },

]
