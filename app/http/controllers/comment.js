import db from '../../models/index.model.js';
const { Post, User } = db;
import mongoose from 'mongoose';
var ObjectId = mongoose.Types.ObjectId;
import _ from 'lodash';
import multer from 'multer';
import path from "path";
import { storageImages } from '../../../config/multer.js';
var success = "Hoàn thành!";

const uploadImage = multer({ storage: storageImages, 
    fileFilter: function (req, file, done) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return done(new Error('Only images are allowed'))
        }
        done(null, true)
      }
});

export const createComment = [
    uploadImage.array("files"),
    async (req, res) => {
        try {
            let images = [];
            if(req.files.length){
                images = req.files.map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""))
            }
            const user = await User.findById(req.user.user_id);
            const post = await Post.findOneAndUpdate(
                { _id: req.params.id },
                {
                    $push: {
                        comments: {
                            _id: new ObjectId(),
                            comment: req.body.comment,
                            user_id: req.user.user_id,
                            username: req.user.username,
                            correct: false,
                            images: images,
                            avatar: user.avatar,
                            vote: 0,
                            voteups: [],
                            votedowns: []
                        }
                    }
                },
                { returnOriginal: false }
            );
            if (post)
                return res.json({ post, message: success });
            return res.status(403).json({
                message: `Không thể bình luận. Có thể không tìm thấy bài đăng hoặc Không có sự cho phép!`,
            });
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    }
]

export async function editComment(req, res) {
    try {
        const commentID = new ObjectId(req.params.commentId);
        const posts = await Post.findOneAndUpdate(
            { _id: req.params.id, "comments._id": commentID },
            {
                $set: {
                    "comments.$.comment": req.body.comment,
                }
            },
            {passRawResult : true, returnOriginal: false }
        );
        if (_.find(posts.comments,{_id:commentID,comment:req.body.comment}))
            return res.json({ posts, message: success });
        return res.status(403).json({
            message: `Không thể sửa bình luận. Bình luận không tồn tại hoặc Không có sự cho phép!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export async function deleteComment(req, res) {
    try {
        const commentID = new ObjectId(req.params.commentId);
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, "comments.user_id": req.user.user_id },
            { $pull: { "comments": {_id: commentID}}},
            { returnOriginal: false }
        );
        if (post)
            return res.json({ post, message: success });
        return res.status(403).json({
            message: `Không thể xóa bình luận. Bình luận không tồn tại hoặc Không có sự cho phép!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }

}

export const vote = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const postId = req.params.id;
        const commentId = new ObjectId(req.params.commentId)
        const up = req.query.up;
        const down = req.query.down;
        // case 1 neu query up =true
        const post = await Post.findById(postId);
        //case 1 thiếu query
        if (!up && !down) {
            return res.json("Nothing to do")
        }
        // case 2 neu query up = true
        if (up == "true") {
            if (post.voteups.includes(userId)) {
                // xoa user do ra khoi array
                await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        $pull: {
                            "voteups": userId
                        }
                    },
                    { returnOriginal: false }
                );
            } else {
                //them user do vao array
                await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        $push: {
                            voteups: userId
                        }
                    },
                    { returnOriginal: false }
                );
            }
        }
        // case 3 neu query down = true
        if (down == "true") {
            if (post.votedowns.includes(userId)) {
                // xoa user do ra khoi array
                await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        $pull: {
                            "votedowns": userId
                        }
                    },
                    { returnOriginal: false }
                );
            } else {
                //them user do vao array
                await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        $push: {
                            votedowns: userId
                        }
                    },
                    { returnOriginal: false }
                );
            }
        }
        const newpost = await Post.findById(postId);
        const { votedowns, voteups } = newpost;
        const votes = voteups.length - votedowns.length;
        await Post.findOneAndUpdate(
            { _id: req.params.id },
            { votes: votes },
            { returnOriginal: false }
        );
        return res.json({ votes, message: success });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}