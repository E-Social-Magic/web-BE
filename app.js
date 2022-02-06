import env from 'dotenv';
env.config();
import connect from './config/database.js';
connect();
import express from 'express';
import path from 'path';
import cors from 'cors';
import HTTPStatus from 'http-status'


const __dirname = path.resolve();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());


app.use(function (req, res, next) {
    return res.status(HTTPStatus.NOT_FOUND).send()  });




export default app;
