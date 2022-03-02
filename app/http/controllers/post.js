import db from '../../models/index.model.js';
const { Post, User } = db;
import { body, validationResult } from 'express-validator';
import storage from 'node-persist';

export function listPost(req, res) {
    Post.find({}, (err, posts) => {
        if (err) { return res.json({ err }) }
        return res.json({ posts: posts })
    })
}

export function detailPost(req, res) {
    Post.findById(req.params.id).populate('user_id').exec(function (err, post) {
        if (err) { return res.json({ err }) }
        return res.json({
            title: post.title,
            content: post.content,
            user_id: post.user_id,
            visible: post.visible
        })
    })
}

export const createPost = [
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('content', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        const post = new Post(req.body)
        if (!errors.isEmpty()) {
            return res.json({ post: post, errors: errors.array() });
        }
        else {
            post.save(function (err) {
                if (err) { return next(err); }
                return res.status(200).json(post);
            });
        }
    }
]
export const editPost = [
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('content', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        Post.findById(req.params.id, (err, post) => {
            if (err) { return res.json({ err }) }
            post.title = req.body.title
            post.content = req.body.content
            post.save().then(result => {
                return res.json({ post: result })
            })
        })
    }
]

export function deletePost(req, res) {
    Post.remove({ _id: req.params.id }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ 'mess': 'Delete success' })
    })
}