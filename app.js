import env from 'dotenv';
env.config();
import connect from './config/database.js';
connect();
import express from 'express';
import path from 'path';
import cors from 'cors';
import HTTPStatus from 'http-status'
import express_session from "express-session";
import router from './routes/index.route.js';
import api from './routes/api.js';
import passport from './config/passport.js';
import bodyParser from 'body-parser';
const __dirname = path.resolve();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express_session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  var msgs = req.session.messages || [];
  var err = req.session.errors || [];
  res.locals.messages = msgs;
  res.locals.errors = err;
  res.locals.hasMessages = !!msgs.length;
  req.session.messages = [];
  next();
});

// app.get('/', function(req, res) {
//     res.send('Page under construction.');
//   });
  
app.use('/api', api);
// app.use('/', router);

// app.use(function (req, res, next) {
//     return res.status(HTTPStatus.NOT_FOUND).send()  });

export default app;
