require('dotenv').config()
const database = require('./config/database');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index.route');

const app = express();
database.connect();

app.use(logger('dev'));
app.use(express.json());

// Cookie parser
app.use(cookieParser());

//parse application/json
app.use(bodyParser.json());

indexRouter(app);

module.exports = app;
