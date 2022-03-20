import db from '../../models/index.model.js';
const { Group } = db;
import _ from 'lodash';
import multer from 'multer';
import { storageImages } from '../../../config/multer.js';
import { generateAvatar } from './generator.js';
var success = "Hoàn thành!";
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

export const listGroup = [async (req, res) => {
    // destructure offset and limit and set default values
    const { offset = 1, limit = 10 } = req.query;

    try {
        // execute query with offset and limit values
        const groups = await Group.find()
            .limit(limit * 1)
            .skip((offset - 1) * limit)
            .exec();

        // get total documents in the Group collection 
        const count = await Group.countDocuments();

        // return response with groups, total offsets, and current offset
        res.json({
            groups,
            totalPages: Math.ceil(count / limit),
            currentPage: offset,
            message: success
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}]

export function detailGroup(req, res) {
    try {
        Group.findById(req.params.id).exec(function (err, group) {
            if (err) { return res.json({ err }) }
            return res.json({
                group_name: group.group_name,
                subject: group.subject,
                private_dt: group.private_dt,
                avatar: group.avatar,
                message: success
            });
        })
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const createGroup = [
    uploadImage.single("avatarG"),
    (req, res, next) => {
        try {
            if (!req.body.group_name) {
                return res.json("Tên nhóm không được để trống.")
            }
            if (!req.body.subject) {
                return res.json("Chủ đề không được để trống.")
            }
            const group = new Group(req.body);
            if (req.file) {
                group.avatar = req.protocol + "://" + req.headers.host + req.file.path.replace("public", "");
            }
            else {
                var uppercaseFirstLetter = req.body.group_name.charAt(0).toUpperCase();
                group.avatar = req.protocol + "://" + req.headers.host + generateAvatar(uppercaseFirstLetter, "avatarG").replace("./public", "");
            }
            group.save(function (err) {
                if (err) { return next(err); }
                return res.status(200).json({ group, message: success });
            });
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }

    }
]

export const editGroup = [
    uploadImage.single("avatarG"),
    async (req, res) => {
        try {
            const data = req.body;
            data.avatar = req.protocol + "://" + req.headers.host + req.file.path.replace("public", "");
            const group = await Group.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user.user_id },
                data,
                { returnOriginal: false }
            );

            if (group)
                return res.json({ group, message: success });
            return res.status(403).json({
                message: `Không thể cập nhật nhóm. Có thể nhóm không được tìm thấy hoặc Không có quyền!`,
            });
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    }
]

export async function deleteGroup(req, res) {
    Group.findOneAndRemove({ _id: req.params.id }, { $or: [{ user_id: req.user.user_id }, { role: "admin" }] }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ message: success })
    });
}