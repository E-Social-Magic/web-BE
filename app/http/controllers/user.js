import db from '../../models/index.model.js';
const { User, Post } = db;
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

export const getAllUser = async (req, res) => {

    const { offset = 1, limit = 10 } = req.query;
    try {
        if (req.user.role == "admin") {
            const user = await User.find(
                { role: { $ne: "admin" } },
                { password: 0 }
            )
                .limit(limit * 1)
                .skip((offset - 1) * limit)
                .exec();
            const count = await Payment.countDocuments();
            res.json({
                payments,
                totalPages: Math.ceil(count / limit),
                currentPage: offset,
                message: success
            });
        }
        return res.status(403).json({ message: noPermission });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const userInfo = async (req, res) => {
    if (req.params.id === req.user.user_id) {
        let user = await User.findOne({ _id: req.user.user_id }, { password: 0 })
        return res.json({ user: user, message: success });
    }
    else {
        let user = await User.findOne({ _id: req.params.id }, { password: 0, payment_id: 0, role: 0 })
        return res.json({ user: user, message: success });
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
                bcrypt.hash(req.body.password, 10, (err, hash) => {
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
                    user.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        // var subject = "Notice of successful registrationThanks "
                        // var view = "<h2>Welcome</h2><p>You have successfully registered</p>";
                        // sendMail(req.body.email, subject, view);
                        return res.json({ message: 'Đăng ký thành công!' })
                    });
                })
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
                data.address = req.body.phone;
            }
            if (description) {
                data.address = req.body.description;
            }
            if (level) {
                data.address = req.body.level;
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
                const userUnblock = await User.findOneAndUpdate(
                    { _id: req.params.id },
                    { blocked: false },
                    { returnOriginal: false }
                );
                return res.json({ blocked: userUnblock.blocked, message: 'Tài khoản đã được mở khóa.' });
            } else {
                const userBlock = await User.findOneAndUpdate(
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

export async function markCorrectAnswer(req, res) {
    try {
        const commentId = new ObjectId(req.params.commentId);
        const checkCorrect = await Post.findOne({
            _id: req.params.id,
            user_id: req.user.user_id, // Chủ bài viết 
            "comments.correct": true,
            costs: true
        });
        if (checkCorrect) {
            return res.json({ message: "Đã đánh dấu 1 câu trả lời đúng trước đó!" })
        }
        else {
            const post = await Post.findOneAndUpdate(
                { "comments._id": commentId },
                {
                    $set: {
                        "comments.$.correct": true,
                    }
                },
                { passRawResult: true, returnOriginal: false }
            );
            const { user_id } = post.comments.find(v => v.correct == true);
            const owner = await User.findById({ _id: post.user_id });
            const user = await User.findById({ _id: user_id });
            const coinsOfOwner = owner.coins + ((10 / 100) * post.coins);
            const coinsOfHelper = user.coins + (post.coins - ((10 / 100) * post.coins));
            await User.findByIdAndUpdate(
                { _id: user_id },
                { coins: coinsOfHelper }
            );
            await User.findByIdAndUpdate(
                { _id: post.user_id },
                { coins: coinsOfOwner }
            );
            if (post)
                return res.json({ user_id, message: 'Đánh dấu câu trả lời đúng thành công!' });
            return res.status(403).json({
                message: `Không thể đánh dấu câu trả lời đúng. Có thể không tìm thấy bài đăng hoặc Không có quyền!`,
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}