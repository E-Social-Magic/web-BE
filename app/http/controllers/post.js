import db from '../../models/index.model.js';
const { Post, User, Group } = db;
import mongoose from 'mongoose';
var ObjectId = mongoose.Types.ObjectId;
import _ from 'lodash';
import multer from 'multer';
import { storageImages, fileFilter } from '../../../config/multer.js';
const uploadImage = multer({
    storage: storageImages,
    fileFilter: fileFilter
});
var success = "Hoàn thành!";
var noPermission = "Không có quyền truy cập!";

export const listPost = [
    async (req, res) => {
        const { offset = 1, limit = 10 } = req.query;
        try {
            if (req.query.search) {
                const posts = await Post.find({
                    $and: [
                        { blocked: { $ne: true } },
                        { private: { $ne: true } },
                        {
                            $text: {
                                $search: req.query.search
                            }
                        }
                    ]
                })
                    .limit(limit * 1)
                    .skip((offset - 1) * limit)
                    .exec();
                const count = await Post.countDocuments();
                posts.sort((a, b) => b.createdAt - a.createdAt)
                return res.json({
                    posts,
                    totalPages: Math.ceil(count / limit),
                    currentPage: offset,
                    message: success
                });
            }
            if(req.query.group_id){
                const posts = await Post.find({
                    $and: [
                        { blocked: { $ne: true } },
                        { private: { $ne: true } },
                        { group_id: req.query.group_id }
                    ]
                })
                    .limit(limit * 1)
                    .skip((offset - 1) * limit)
                    .exec();
                const count = await Post.countDocuments();
                posts.sort((a, b) => b.createdAt - a.createdAt)
                return res.json({
                    posts,
                    totalPages: Math.ceil(count / limit),
                    currentPage: offset,
                    message: success
                });
            }
            else {
                const posts = await Post.find({
                    $and: [
                        { blocked: { $ne: true } },
                        { private: { $ne: true } }
                    ]
                })
                    .limit(limit * 1)
                    .skip((offset - 1) * limit)
                    .exec();
                const count = await Post.countDocuments();
                posts.sort((a, b) => b.createdAt - a.createdAt)
                return res.json({
                    posts,
                    totalPages: Math.ceil(count / limit),
                    currentPage: offset,
                    message: success
                });
            }
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    },
]

export const listPostForAd = [
    async (req, res) => {
        const { offset = 1, limit = 10 } = req.query;
        try {
            if (req.user.role == "admin") {
                const posts = await Post.find({})
                    .limit(limit * 1)
                    .skip((offset - 1) * limit)
                    .exec();
                const count = await Post.countDocuments();
                posts.sort((a, b) => b.createdAt - a.createdAt)
                return res.json({
                    posts,
                    totalPages: Math.ceil(count / limit),
                    currentPage: offset,
                    message: success
                });
            }
            else if (req.query.search && req.user.role == "admin") {
                const posts = await Post.find({
                    $text: {
                        $search: req.query.search
                    }
                })
                    .limit(limit * 1)
                    .skip((offset - 1) * limit)
                    .exec();
                const count = await Post.countDocuments();
                posts.sort((a, b) => b.createdAt - a.createdAt)
                return res.json({
                    posts, totalPages: Math.ceil(count / limit),
                    currentPage: offset, message: success
                });
            }
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    },
]

export const detailPost = async (req, res) => {
    try {
        const post = await Post.findById({ _id: req.params.id });
        if (post.blocked == true) {
            return res.json({ message: "Bài viết đã bị chặn bởi Admin" })
        }
        else {
            return res.json({
                post: post,
                message: success
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const detailPostForAd = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });
        if (req.user.role == "admin") {
            return res.json({ post, message: success });
        }
        else {
            return res.json({ message: noPermission })
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const checkExpired = async () => {
    return await Post.updateMany(
        { expired: { $lt: new Date().getTime() / 1000 } },
        { private: true }
    );
}
// Tạo function 
export const createPost = [
    uploadImage.array("files"),
    async (req, res, next) => {
        if (!req.body.title) {
            return res.json({message: "Tiêu đề không được để trống."})
        }
        if (!req.body.content) {
            return res.json({message:"Nội dung không được để trống."})
        }
        if (!req.body.group_id) {
            return res.json({message:"Hãy chọn nhóm mà bạn muốn đăng bài."})
        }
        const group_id = new ObjectId(req.body.group_id);
        const user = await User.findOne({ _id: req.user.user_id });
        if (!user.subjects.includes(group_id)) {
            return res.json("Bạn chưa tham gia vào nhóm bạn muốn đăng bài viết!");
        }
        const expired = req.body.expired;
        if (expired < new Date().getTime() / 1000 || !expired || !new Date(expired)) {
            req.body.expired = 4075911643;
        }
        if (req.body.costs == "true" && req.body.hideName == "true") {
            return await createPostAnonymouslyCosts(req, res, next);
        }
        if (req.body.costs == "false" && req.body.hideName == "true") {
            return await createPostAnonymously(req, res, next);
        }
        if (req.body.costs == "true") {
            return await createPostCosts(req, res, next);
        }
        else {
            const user = await User.findById(req.user.user_id);
            const post = new Post(req.body);
            post.user_id = req.user.user_id;
            post.username = req.user.username;
            post.author_avatar = user.avatar;
            post.group_id = req.body.group_id;
            post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            const postAfter = await post.save();
            if (!postAfter) {
                return res.json({ message: 'Đăng bài không thành công!' });
            }
            await Group.findByIdAndUpdate(
                { _id: req.body.group_id },
                {
                    $push: { posts: postAfter._id }
                },
                { returnOriginal: false }
            )
            return res.status(200).json({ postAfter, message: success });
        }
    }
]

export const createPostCosts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.user_id);
        if (user.coins < req.body.coins) {
            return res.json({ message: "Vui lòng nạp thêm tiền" });
        }
        else {
            const user = await User.findById(req.user.user_id);
            const post = new Post(req.body);
            post.user_id = req.user.user_id;
            post.username = req.user.username;
            post.author_avatar = user.avatar;
            post.costs = true;
            post.group_id = req.body.group_id;
            post.coins = req.body.coins;
            post.expired = req.body.expired;
            post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            const coinsAfterPost = user.coins - post.coins;
            await User.findByIdAndUpdate(
                { _id: req.user.user_id },
                { coins: coinsAfterPost }
            );
            const postAfter = await post.save();
            if (!postAfter) {
                return res.json({ message: 'Đăng bài không thành công!' });
            }
            await Group.findByIdAndUpdate(
                { _id: req.body.group_id },
                {
                    $push: { posts: postAfter._id }
                },
                { returnOriginal: false }
            )
            return res.status(200).json({ postAfter, message: success });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const createPostAnonymously = async (req, res, next) => {
    const user = await User.findById(req.user.user_id);
    const post = new Post(req.body);
    post.user_id = req.user.user_id;
    post.author_avatar = user.avatar;
    post.username = "Ẩn danh";
    post.hideName = true;
    post.group_id = req.body.group_id;
    post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
    post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
    const postAfter = await post.save();
    if (!postAfter) {
        return res.json({ message: 'Đăng bài không thành công!' });
    }
    await Group.findByIdAndUpdate(
        { _id: req.body.group_id },
        {
            $push: { posts: postAfter._id }
        },
        { returnOriginal: false }
    )
    return res.status(200).json({ postAfter, message: success });
}

export const createPostAnonymouslyCosts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.user_id);
        if (user.coins < req.body.coins) {
            return res.json({ message: "Vui lòng nạp thêm tiền" });
        }
        else {
            const user = await User.findById(req.user.user_id);
            const post = new Post(req.body);
            post.user_id = req.user.user_id;
            post.author_avatar = user.avatar;
            post.username = "Ẩn danh";
            post.hideName = true;
            post.costs = true;
            post.group_id = req.body.group_id;
            post.coins = req.body.coins;
            post.expired = req.body.expired;
            post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            const coinsAfterPost = user.coins - post.coins;
            await User.findByIdAndUpdate(
                { _id: req.user.user_id },
                { coins: coinsAfterPost }
            );
            const postAfter = await post.save();
            if (!postAfter) {
                return res.json({ message: 'Đăng bài không thành công!' });
            }
            await Group.findByIdAndUpdate(
                { _id: req.body.group_id },
                {
                    $push: { posts: postAfter._id }
                },
                { returnOriginal: false }
            )
            return res.status(200).json({ postAfter, message: success });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const editPost = [
    uploadImage.array("files"),
    async (req, res) => {
        try {
            const data = req.body;
            if (req.files) {
                await Post.findOneAndUpdate(
                    { _id: req.params.id, user_id: req.user.user_id },
                    {
                        $set: {
                            "images": req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", "")),
                            "videos": req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""))
                        }
                    },
                    { returnOriginal: false }
                );
            }
            const post = await Post.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user.user_id },
                data,
                { returnOriginal: false }
            );
            if (post)
                return res.json({ post, message: 'Bài đăng đã được cập nhật thành công.' });
            return res.status(403).json({
                message: `Không thể cập nhật bài đăng. Có thể không tìm thấy bài đăng hoặc Không có sự cho phép!`,
            });
        } catch (error) {
            return res.status(500).json({
                message: `Lỗi: ${error}`,
            });
        }
    }
]

export async function deletePost(req, res) {
    Post.findOneAndRemove({ _id: req.params.id }, { $or: [{ user_id: req.user.user_id }, { role: "admin" }] }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ message: success })
    });
}

export const vote = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const postId = req.params.id;
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
                await Post.findByIdAndUpdate(
                    { _id: postId },
                    {
                        $pull: {
                            "voteups": userId
                        }
                    },
                    { returnOriginal: false }
                );
            } else {
                //them user do vao array
                await Post.findByIdAndUpdate(
                    { _id: postId },
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
                await Post.findByIdAndUpdate(
                    { _id: postId },
                    {
                        $pull: {
                            "votedowns": userId
                        }
                    },
                    { returnOriginal: false }
                );
            } else {
                //them user do vao array
                await Post.findByIdAndUpdate(
                    { _id: postId },
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
        await Post.findByIdAndUpdate(
            { _id: postId },
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

export const blockPost = async (req, res) => {
    try {
        if (req.user.role == "admin") {
            const postId = req.params.id;
            const post = await Post.findByIdAndUpdate(postId);
            if (post.blocked == true) {
                const postUnblock = await Post.findByIdAndUpdate(
                    { _id: postId },
                    { blocked: false },
                    { returnOriginal: false }
                );
                return res.json({ blocked: postUnblock.blocked, message: 'Bài đăng đã được bỏ chặn thành công.' });
            } else {
                const postBlock = await Post.findByIdAndUpdate(
                    { _id: postId },
                    { blocked: true },
                    { returnOriginal: false }
                );
                return res.json({ blocked: postBlock.blocked, message: 'Bài đăng đã bị chặn thành công.' });
            }
        }
        return res.status(403).json({
            message: `Không thể chặn bài đăng. Có thể không tìm thấy bài đăng hoặc Không có sự cho phép!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}