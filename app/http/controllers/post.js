import db from '../../models/index.model.js';
const { Post } = db;
import { check, body, validationResult } from 'express-validator';
import storage from 'node-persist';

export function listPost(req, res) {
    const col = 'title content user_id visible updated'
    Post.find({}, col, (err, posts) => {
        if (err) { return res.json({ err }) }
        res.json({ posts: posts })
    })
}

export function detailPost(req, res) {
    Post.findById(req.params.id).populate('user_id').exec(function (err, post) {
        if (err) { return res.json({ err }) }
        res.json({
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
    body('visible', 'Visible must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        const errors = validationResult(req);
        const post = new Post(req.body)
        if (!errors.isEmpty()) {
            res.json({ post: req.body, errors: errors.array() });
            return;
        }
        else {
            // post.user_id = req.session.user._id
            post.save().then(result => {
                res.json({ post: result })
            })
        }
    }
]
export const editPost = [
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('content', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('visible', 'Visible must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        Post.findById(req.params.id, 'title content', (err, post) => {
            if (err) { return res.json({ err }) }
            post.title = req.body.title
            post.content = req.body.content
            post.save().then(result => {
                res.json({ post: result })
            })
        })
    }
]


export function deletePost(req, res) {
    Post.remove({ _id: req.params.id }, (err) => {
        if (err) { return res.json({ err }) }
        res.json({ 'mess': 'Delete success' })
    })
}