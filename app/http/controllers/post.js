import db from '../../models/index.model.js';
const { Post, User } = db;
import _ from 'lodash';
import multer from 'multer';
import { storageImages, fileFilter } from '../../../config/multer.js';
const uploadImage = multer({
    storage: storageImages,
    fileFilter: fileFilter
});

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
                return res.json({
                    posts, totalPages: Math.ceil(count / limit),
                    currentPage: offset, message: 'Hoàn thành tìm kiếm'
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
                return res.json({
                    posts,
                    totalPages: Math.ceil(count / limit),
                    currentPage: offset
                });
            }
        } catch (err) {
            console.error(err.message);
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
                return res.json({
                    posts,
                    totalPages: Math.ceil(count / limit),
                    currentPage: offset
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
                return res.json({
                    posts, totalPages: Math.ceil(count / limit),
                    currentPage: offset, message: 'Hoàn thành tìm kiếm'
                });
            }
        } catch (err) {
            console.error(err.message);
        }
    },
]

export const detailPost = async (req, res) => {
    try {
        const post = await Post.findById({ _id: req.params.id });
        const user = await User.findById(post.user_id);
        if (post.blocked == true) {
            return res.json({ message: "Bài viết đã bị chặn bởi Admin" })
        }
        else {
            return res.json({
                title: post.title,
                content: post.content,
                username: user.username,
                comments: post.comments,
                images: post.images,
                coins: post.coins
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const detailPostForAd = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });
        if (req.user.role == "admin") {
            return res.json({ post });
        }
        else {
            return res.json("Bạn không có quyền truy cập!")
        }
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}
// Tạo function 
export const createPost = [
    uploadImage.array("files"),
    async (req, res, next) => {
        if (!req.body.title) {
            return res.json("Title must not be empty.")
        }
        if (!req.body.content) {
            return res.json("Content must not be empty.")
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
            const post = new Post(req.body);
            post.user_id = req.user.user_id;
            post.username = req.user.username;
            post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            post.save(function (err) {
                if (err) { return next(err); }
                return res.status(200).json(post);
            });
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
            const post = new Post(req.body);
            post.user_id = req.user.user_id;
            post.username = req.user.username;
            post.costs = true;
            post.coins = req.body.coins;
            post.expired = req.body.expired;
            post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            const coinsAfterPost = user.coins - post.coins;
            await User.findByIdAndUpdate(
                { _id: req.user.user_id },
                { coins: coinsAfterPost }
            );
            post.save(function (err) {
                if (err) { return next(err); }
                return res.status(200).json(post);
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const createPostAnonymously = async (req, res, next) => {
    const post = new Post(req.body);
    post.user_id = req.user.user_id;
    post.username = "Anonymously";
    post.hideName = true;
    post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
    post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
    post.save(function (err) {
        if (err) { return next(err); }
        return res.status(200).json(post);
    });
}

export const createPostAnonymouslyCosts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.user_id);
        if (user.coins < req.body.coins) {
            return res.json({ message: "Vui lòng nạp thêm tiền" });
        }
        else {
            const post = new Post(req.body);
            post.user_id = req.user.user_id;
            post.username = "Anonymously";
            post.hideName = true;
            post.costs = true;
            post.coins = req.body.coins;
            post.expired = req.body.expired;
            post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
            const coinsAfterPost = user.coins - post.coins;
            await User.findByIdAndUpdate(
                { _id: req.user.user_id },
                { coins: coinsAfterPost }
            );
            post.save(function (err) {
                if (err) { return next(err); }
                return res.status(200).json(post);
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const editPost = [
    uploadImage.array("files"),
    async (req, res) => {
        try {
            const data = req.body;
            await Post.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user.user_id },
                data,
                { returnOriginal: false }
            );
            const post = await Post.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user.user_id },
                {
                    $set: {
                        "images": req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", "")),
                    }
                },
                { returnOriginal: false }
            );

            if (post)
                return res.json({ post, message: 'Post was updated successfully.' });
            return res.status(403).json({
                message: `Cannot update post with id=${req.params.id}. Maybe post was not found or No permission!`,
            });
        } catch (error) {
            return res.status(500).json({
                message: `Error: ${error}`,
            });
        }
    }
]

export async function deletePost(req, res) {
    Post.findOneAndRemove({ _id: req.params.id }, { $or: [{ user_id: req.user.user_id }, { role: "admin" }] }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ 'mess': 'Delete success' })
    });
}

export const vote = [
    async (req, res, next) => {
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
        return res.json({ votes });
    }
]

export const blockPost = async (req, res) => {
    try {
        if (req.user.role == "admin") {
            const postId = req.params.id;
            const post = await Post.findByIdAndUpdate(postId);
            if (post.blocked == true) {
                const postUnblock = await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    { blocked: false },
                    { returnOriginal: false }
                );
                return res.json({ blocked: postUnblock.blocked, message: 'Post was unblocked successfully.' });
            } else {
                const postBlock = await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    { blocked: true },
                    { returnOriginal: false }
                );
                return res.json({ blocked: postBlock.blocked, message: 'Post was blocked successfully.' });
            }
        }
        return res.status(403).json({
            message: `Cannot blocked post with id=${req.params.id}. Maybe post was not found or No permission!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}