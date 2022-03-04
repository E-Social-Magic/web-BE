import db from '../../models/index.model.js';
const { Post, User } = db;
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { storage } from '../../../config/multer.js';
const upload = multer({ storage: storage });

export function listPost(req, res) {
    Post.find({}, (err, posts) => {
        if (err) { return res.json({ err }) }
        return res.json({ posts: posts })
    })
}

export function detailPost(req, res) {
    Post.findById(req.params.id).populate('user_id').exec(function (err, post) {
        if (err) { return res.json({ err }) }
        User.findById(post.user_id).exec(function (err, user) {
            if (err) { return res.json({ err }) }
            if (post.visible == 1) {
                return res.json({
                    title: post.title,
                    content: post.content,
                    username: "anonymously",
                    img: post.img
                });
            }
            else {
                return res.json({
                    title: post.title,
                    content: post.content,
                    username: user.username,
                    img: post.img
                });
            }

        })
    })
}

export const createPost = [
    upload.array("files"),
    (req, res, next) => {
        if (!req.body.title) {
            return res.json("Title must not be empty.")
        }
        if (!req.body.content) {
            return res.json("Content must not be empty.")
        }
        const post = new Post(req.body);
        post.user_id = req.session.passport.user;
        post.img = req.files.map((file) => file.path);
        post.save(function (err) {
            if (err) { return next(err); }
            return res.status(200).json(post);
        });
    }
]

export const createPostAnonymously = [
    upload.array("files"),
    (req, res, next) => {
        if (!req.body.title) {
            return res.json("Title must not be empty.")
        }
        if (!req.body.content) {
            return res.json("Content must not be empty.")
        }
        const post = new Post(req.body);
        post.user_id = req.session.passport.user;
        post.visible = 1;
        post.img = req.files.map((file) => file.path);
        post.save(function (err) {
            if (err) { return next(err); }
            return res.status(200).json(post);
        });
    }
]

export async function editPost(req, res) {
    try {
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, user_id: req.session.passport.user },
            req.body,
            { returnOriginal: false }
        );
        if (post)
            return res.json({ post, message: 'post was updated successfully.' });
        return res.status(403).json({
            message: `Cannot update post with id=${req.params.id}. Maybe post was not found or No permission!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error updating post with id= ${error}`,
        });
    }
}

export async function deletePost(req, res) {
    Post.findOneAndRemove({ _id: req.params.id }, { $or: [{ user_id: req.session.passport.user }, { role: "admin" }] }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ 'mess': 'Delete success' })
    });
}