import db from '../../models/index.model.js';
const { Group } = db;
import { check, body, validationResult } from 'express-validator';

export function listGroup(req, res) {
    Group.find({}, (err, groups) => {
        if (err) { return res.json({ err }) }
        return res.json({ groups: groups })
    })
}

export function detailGroup(req, res) {
    Group.findById(req.params.id).populate('private_dt').exec(function (err, group) {
        if (err) { return res.json({ err }) }
        return res.json({
            name: group.name,
            subject: group.subject,
            private_dt: group.private_dt,
            visible: group.visible
        })
    })
}

export const createGroup = [
    body('name', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('subject', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('visible', 'Visible must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        const errors = validationResult(req);
        const group = new Group(req.body)
        if (!errors.isEmpty()) {
            return res.json({ group: res.body , errors: errors.array() });
        }
        else {
            group.save().then(result => {
                return res.json({ group: result })
            })
        }
    }
]
export const editGroup = [
    body('name', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('subject', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('visible', 'Visible must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        Group.findById(req.params.id, 'name subject', (err, group) => {
            if (err) { return res.json({ err }) }
            group.name = req.body.name
            group.subject = req.body.subject
            group.save().then(result => {
                return res.json({ group: result })
            })
        })
    }
]

export function deleteGroup(req, res) {
    Group.remove({ _id: req.params.id }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ 'mess': 'Delete success' })
    })
}