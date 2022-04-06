import env from 'dotenv';
env.config();
import connect from './config/database.js';
connect();
import express from 'express';
import path from 'path';
import cors from 'cors';
import HTTPStatus from 'http-status'
import router from './routes/index.route.js';
import api from './routes/api.js';
import passport from './config/passport.js';
import bodyParser from 'body-parser';
import { checkExpired } from './app/http/controllers/post.js';
const __dirname = path.resolve();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use('/api', api);

setInterval( async () => {
    await checkExpired();
}, 1000*60);

export default app;
