import db from '../../models/index.model.js';
const { Private_data } = db;
import { check, body, validationResult } from 'express-validator';
import storage from 'node-persist';

export function listPrivateData(req, res) {
    Private_data.find({}, col, (err, private_datas) => {
        if (err) { return res.json({ err }) }
        return res.json({ private_datas: private_datas })
    })
}

export function detailPrivateData(req, res) {
    Private_data.findById(req.params.id).exec(function (err, private_data) {
        if (err) { return res.json({ err }) }
        return res.json({
            name: private_data.name,
            role: private_data.role,
            type: private_data.type
        })
    })
}

export const createPrivateData = [
    body('name', 'Name must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('role', 'Role must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('type', 'Type must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        const errors = validationResult(req);
        const private_data = new Private_data(req.body)

        if (!errors.isEmpty()) {
            return res.json({ private_data: req.body, errors: errors.array() });
        }
        else {
            private_data.save().then(result => {
                return res.json({ private_data: result })
            })
        }
    }
]
export const editPrivateData = [
    body('name', 'Name must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('role', 'Role must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('type', 'Type must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        Private_data.findById(req.params.id, 'name role', (err, private_data) => {
            if (err) { return res.json({ err }) }
            private_data.name = req.body.name
            private_data.save().then(result => {
                return res.json({ private_data: result })
            })
        })
    }
]


export function deletePrivateData(req, res) {
    Private_data.remove({ _id: req.params.id }, (err) => {
        if (err) { return res.json({ err }) }
        return res.json({ message: 'Delete success' })
    })
}