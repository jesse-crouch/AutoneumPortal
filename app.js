var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var hash = require('crypto-js');
var secretKey = '8c05737c6e56bcf32d97e8169556ab708ce353a47e65460fb3b16fcdaa43edc6';
var { Client } = require('pg');
var client = new Client({
    host: 'localhost',
    port: '5432',
    database: 'SupplyRequest',
    user: 'postgres',
    password: 'mplkO0'
});
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Routers for index, login, register, line, shipping, line setup,
//    shipping setup, status, materials, users
var indexRouter = require('./routes/indexRouter');
var loginRouter = require('./routes/loginRouter');
var registerRouter = require('./routes/registerRouter');
var lineRouter = require('./routes/lineRouter');
var shippingRouter = require('./routes/shippingRouter');
var lineSetupRouter = require('./routes/lineSetupRouter');
var shippingSetupRouter = require('./routes/shippingSetupRouter');
var statusRouter = require('./routes/statusRouter');
var matsRouter = require('./routes/matsRouter');
var usersRouter = require('./routes/usersRouter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

client.connect();
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/line', lineRouter);
app.use('/shipping', shippingRouter);
app.use('/setup/line', lineSetupRouter);
app.use('/setup/shipping', shippingSetupRouter);
app.use('/status', statusRouter);
app.use('/materials', matsRouter);
app.use('/users', usersRouter);

function getTimestamp(req) {
    var date = new Date();
    return '[' + date.getHours() + ':' + date.getMinutes() + ':' +
        date.getSeconds() + '][' + req.connection.remoteAddress.substring(7) +
        '] ';
}

// POST and GET backend methods ***********************************************

app.post('/verifyLogin', (req, res) => {
    // Check if user exists with the given email
    var query = 'select * from users where users.email = \'' + req.body.email +
        '\'';
    client.query(query, (err, result) => {
        if (err) console.log(err);
        if (result.rows.length > 0) {
            // User exists, check passwords using DB stored salt
            var formPassword = hash.SHA256(req.body.password + result.rows[0].salt);

            if (formPassword == result.rows[0].password) {
                // Passwords match, generate a token and send it to client
                var payload = {
                    first_name: result.rows[0].first_name,
                    surname: result.rows[0].surname,
                    email: result.rows[0].email,
                    level: result.rows[0].level
                };
                var token = jwt.sign(payload, secretKey);

                console.log(getTimestamp(req) + 'Login successful, sending token');
                res.json({success: true, token: token});
            } else {
                // Passwords don't match
                console.log(getTimestamp(req) + 'Login failed, passwords don\'t match');
                res.json({success: false, reason: 'wrong_pass'});
            }
        } else {
            // User doesn't exist
            console.log(getTimestamp(req) + 'Login failed, user doesn\'t exist');
            res.json({success: false, reason: 'no_user'});
        }
    });
});

// Send the jwt payload given the token
app.post('/verifyToken', (req, res) => {
    try {
        var payload = jwt.verify(req.body.token, secretKey);
        console.log(getTimestamp(req) + 'Token verified');
        res.json({success: true, info: payload});

    } catch(err) {
        console.log(getTimestamp(req) + 'Error verifying token');
        res.json({success: false});
    }
});

// POST and GET backend methods END********************************************

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
