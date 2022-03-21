import db from '../../models/index.model.js';
const { User, Group } = db;
import mongoose from 'mongoose';
var Schema = mongoose.Schema;
import _ from 'lodash';
var success = "Hoàn thành!";

export const createSubject = async (req, res) => {
        try {
            if(!(req.body.subjects instanceof Array)){
                return res.status(400).end();
            }
            const groups = await Group.find({ _id: req.body.subjects });
            const arr = groups.map(group => group._id);
            await Group.updateMany(
                { _id:{$in: arr}},
                {
                 $push: {user_id: req.user.user_id}
                },
                { returnOriginal: false }
            )
            const user = await User.findOneAndUpdate(
                    { _id: req.user.user_id},
                    {
                    subjects: arr
                    },
                    { returnOriginal: false }
                );
            
            if(user) 
                return res.json({ user, message: "Đăng ký thành công!" });
            return res.status(403).json({
                message: `Không thể thêm chủ đề. Có thể người dùng không tìm thấy hoặc Không có quyền!`,
            });

        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    }

export async function editSubject(req, res) {
    try {
        if(!(req.body.subjects instanceof Array)){
            return res.status(400).end();
        }
        const groups = await Group.find({ _id: req.body.subjects });
        const arr = groups.map(group => group._id);
        await Group.updateMany(
            { _id:{$in: arr}},
            {
             $push: {user_id: req.user.user_id}
            },
            { returnOriginal: false }
        )
        const user = await User.findOneAndUpdate(
                { _id: req.user.user_id },
                {
                    subjects: arr
                },
                { returnOriginal: false }
            );
        
        if(user)
            return res.json({ subjects: user.subjects, message: success });
        return res.status(403).json({
            message: `Không thể chỉnh sửa chủ đề. Có thể người dùng không tìm thấy hoặc Không có quyền!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export async function deleteSubject(req, res) {
    try {
        if(!(req.body.subjects instanceof Array)){
            return res.status(400).end();
        }
        const groups = await Group.find({ _id: req.body.subjects });
        const arr = groups.map(group => group._id);
        await Group.updateMany(
            { _id:{$in: arr}},
            {
             $pull: {user_id: req.user.user_id}
            },
            { returnOriginal: false }
        )
        const user = await User.findOneAndUpdate(
                { _id: req.user.user_id },
                {
                    $pull: {subjects: arr}
                },
                { returnOriginal: false }
            );
        if (user)
            return res.json({ subjects: user.subjects, message: success });
        return res.status(403).json({
            message: `Không thể xóa chủ đề. Có thể người dùng không tìm thấy hoặc Không có quyền!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }

}
