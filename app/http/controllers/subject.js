import db from '../../models/index.model.js';
const { Subject } = db;
import { body, validationResult } from 'express-validator';

export function listSubject(req, res) {
    const col = 'title content user_id visible updated'
    Subject.find({}, col, (err, subjects) => {
        if (err) { return res.json({ err }) }
        return res.json({ subjects: subjects })
    })
}

export function detailSubject(req, res) {
    Subject.findById(req.params.id).exec(function (err, subject) {
        if (err) { return res.json({ err }) }
        return res.json({
            name: subject.name
        })
    })
}

export const createSubject = [
    body('name', 'Name subject must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        const errors = validationResult(req);
        const subject = new Subject(req.body)
        if (!errors.isEmpty()) {
            return res.json({ subject: req.body, errors: errors.array() });
        }
        else {
            subject.save().then(result => {
                return res.json({ subject: result })
            })
        }
    }
]

export const editSubject = [
    body('name', 'Name subject must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        Subject.findById(req.params.id, (err, subject) => {
            if (err) { return res.json({ err }) }
            subject.name = req.body.name
            subject.save().then(result => {
                return res.json({ subject: result })
            })
        })
    }
]

export function deleteSubject(req, res) {
    Subject.remove({ _id: req.params.id }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ 'mess': 'Delete success' })
    })
}