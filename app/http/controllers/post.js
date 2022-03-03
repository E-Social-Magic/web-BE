import db from '../../models/index.model.js';
const { Post, User } = db;
import { body, validationResult } from 'express-validator';

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
        const post = new Post(req.body);
        post.user_id = req.session.passport.user;
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

export async function editPost (req, res) {
    try {
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, user_id: req.session.passport.user },
                req.body,
            {returnOriginal : false}
        );
        if (post)
            return res.json({ post , message: 'Post was updated successfully.' });
        return res.status(403).json({
            message: `Cannot update post with id=${req.params.id}. Maybe post was not found or No permission!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error updating post with ${error}`,
        });
    }
}

export function deletePost(req, res) {
    Post.findOneAndRemove({ _id: req.params.id, user_id: req.session.passport.user}, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ 'mess': 'Delete success' })
    })
}