import db from '../../models/index.model.js';
const { Post, User } = db;
import _ from 'lodash';
import multer from 'multer';
import { storageImages, fileFilter } from '../../../config/multer.js';
const uploadImage = multer({
    storage: storageImages,
    fileFilter: fileFilter
});

export const listPost = [async (req, res) => {
    // destructure offset and limit and set default values
    const { offset = 1, limit = 10 } = req.query;

    try {
        // execute query with offset and limit values
        const posts = await Post.find()
            .limit(limit * 1)
            .skip((offset - 1) * limit)
            .exec();

        // get total documents in the Post collection 
        const count = await Post.countDocuments();

        // return response with posts, total offsets, and current offset
        res.json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: offset
        });
    } catch (err) {
        console.error(err.message);
    }
}]

export function detailPost(req, res) {
    Post.findById(req.params.id).populate('user_id').exec(function (err, post) {
        if (err) { return res.json({ err }) }
        User.findById(post.user_id).exec(function (err, user) {
            if (err) { return res.json({ err }) }
            if (post.visible == 1) {
                return res.json({
                    title: post.title,
                    content: post.content,
                    username: "Anonymously",
                    comments: post.comments,
                    images: post.images
                });
            }
            else {
                return res.json({
                    title: post.title,
                    content: post.content,
                    username: user.username,
                    comments: post.comments,
                    images: post.images
                });
            }

        })
    })
}

export const createPost = [
    uploadImage.array("files"),
    (req, res, next) => {
        if (!req.body.title) {
            return res.json("Title must not be empty.")
        }
        if (!req.body.content) {
            return res.json("Content must not be empty.")
        }
        const post = new Post(req.body);
        post.user_id = req.user.user_id;
        post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
        post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
        post.save(function (err) {
            if (err) { return next(err); }
            return res.status(200).json(post);
        });
    }
]

export const createPostAnonymously = [
    uploadImage.array("files"),
    (req, res, next) => {
        if (!req.body.title) {
            return res.json("Title must not be empty.")
        }
        if (!req.body.content) {
            return res.json("Content must not be empty.")
        }
        const post = new Post(req.body);
        post.user_id = req.user.user_id;
        post.visible = 1;
        post.images = req.files.filter(v => !_.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
        post.videos = req.files.filter(v => _.includes(v.path, ".mp4")).map((file) => req.protocol + "://" + req.headers.host + file.path.replace("public", ""));
        post.save(function (err) {
            if (err) { return next(err); }
            return res.status(200).json(post);
        });
    }
]

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
        console.log(up);
        // case 1 neu query up =true
        const post = await Post.findById(postId);
        //case 1 thiếu query
        if (!up && !down) {
            return res.json("Nothing to do")
        }
        // case 2 neu query up = true
        if (up == "true") {
            console.log("hello");
            if (post.voteups.includes(userId)) {
                // xoa user do ra khoi array
                await Post.findOneAndUpdate(
                    { _id: req.params.id},
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
                            "votedowns":userId
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
        const {votedowns,voteups} = newpost
        const votes = voteups.length - votedowns.length;
        await Post.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.user_id },
            { votes : votes},
            { returnOriginal: false }
        );
        return res.json(votes);
    }
]