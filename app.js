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
    database: 'autoneumportal',
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

function getTimestamp() {
    var date = new Date();
    return date.getHours() + ':' + date.getMinutes() + ':' +
        date.getSeconds();
}

// Method to verify user can access page
function canUserAccess(token, level) {
    var payload = jwt.verify(token, secretKey);
    if (payload.level >= level) {
        return true;
    } else {
        return false;
    }
}

// POST and GET backend methods ***********************************************

// Verify login details, and create jwt if correct
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

// Client requesting a list of all lines
app.post('/getLines', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'select number from line';
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    lines: result.rows
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client requesting a list of all line modes given a line number
app.post('/getLineModes', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'select line_mode from line where line.number = \'' + req.body.number + '\'';
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    modes: result.rows
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client requesting a list of all materials given a line number and mode
app.post('/getMaterials', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'select name from material, line where material.line_id = line.line_id and line.number = \'' + req.body.number + '\' and line.line_mode = \'' + req.body.line_mode + '\'';
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    materials: result.rows
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client is requesting the material id for a given line, mode, and material name
app.post('/getMaterialLineID', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'select material_id, line.line_id from material, line where material.line_id = line.line_id and material.name = \'' + req.body.name + '\' and line.number = \'' + req.body.number + '\' and line.line_mode = \'' + req.body.line_mode + '\'';
        console.log('\n' + query + '\n');
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    line_id: result.rows[0].line_id,
                    material_id: result.rows[0].material_id
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client is requesting line information given a material ID
app.post('/getLineInfo', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'select number, line_mode, name from material, line where material.line_id = line.line_id and material_id = \'' + req.body.material_id + '\'';
        console.log('\n' + query + '\n');
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    line_info: result.rows
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client from shipping is requesting line information given a request ID
app.post('/getLineInfoShipping', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'select number, line_mode, name from material, line, request where ' +
            'request.line_id = line.line_id and request.material_id = material.material_id ' +
            ' and request_id = \'' + req.body.request_id + '\'';
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    line_info: result.rows
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client is request list of all requests
app.post('/getAllStatusRequest', (req, res) => {
    if (canUserAccess(req.body.token, 2)) {
        var query = 'select status, number, name, colour, code, time_requested from ' +
            'request, material, line where request.line_id = line.line_id and' +
            ' request.material_id = material.material_id';
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    requests: result.rows
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client is request list of all active requests
app.post('/getActiveRequests', (req, res) => {
    if (canUserAccess(req.body.token, 2)) {
        var query = 'select time_requested, number, name, colour, code, request_id from ' +
            'request, material, line where request.line_id = line.line_id and' +
            ' request.material_id = material.material_id and request.status = ' +
            '\'Active\'';
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    requests: result.rows
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

app.post('/newRequest', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'insert into request (line_id, material_id, status, ' +
            'time_requested) values (\'' + req.body.line_id + '\', \'' + req.body.material_id +
            '\', \'Active\', \'' + getTimestamp() + '\')';

        console.log('\n' + query + '\n');
        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.json({success: false});
            } else {
                // Request created, now fetch the ID to send back to client
                var idQuery = 'select request_id from request where line_id = \'' +
                    req.body.line_id + '\' and material_id = \'' + req.body.material_id + '\'';
                console.log('\nID:' + idQuery + '\n');
                client.query(idQuery, (idErr, idResult) => {
                    if (idErr) console.log(idErr);

                    if (idResult.rows.length > 0) {
                        res.json({
                            success: true,
                            request_id: idResult.rows[0].request_id
                        });
                    } else {
                        res.json({success: false});
                    }
                });
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Client is requesting the status of a request given the ID
app.post('/statusUpdateLine', (req, res) => {
    if (canUserAccess(req.body.token, 1)) {
        var query = 'select status from request where request_id = \'' +
            req.body.request_id + '\'';
        client.query(query, (err, result) => {
            if (err) console.log(err);

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    status: result.rows[0].status
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Request has been confirmed by both parties, so close it
app.post('/requestCompleteShipping', (req, res) => {
    if (canUserAccess(req.body.token, 2)) {
        var activeInfoQuery = 'select line_id, material_id, time_requested from' +
            ' request where request_id = \'' + req.body.request_id + '\'';
            console.log(query + '\n');
        client.query(query, (activeInfoErr, activeInfoResult) => {
            if (activeInfoErr) console.log(activeInfoErr);
            if (activeInfoResult.rows.length > 0) {

                // Have the info from the request, create a completed_request
                var query = 'insert into completed_request (line_id, material_id' +
                    ', time_requested, time_completed) values (\'' +
                    activeInfoResult.rows[0].line_id + '\', \'' +
                    activeInfoResult.rows[0].material_id + '\', \'' +
                    activeInfoResult.rows[0].time_requested + '\', \'' + getTimestamp() + '\')';
                client.query(query, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.json({success: false});
                    } else {
                        // Completed_request made, remove the active one
                        var removeQuery = 'delete from request where request_id = \'' +
                            req.body.request_id + '\'';
                        client.query(removeQuery, (removeErr, removeResult) => {
                            if (removeErr) {
                                console.log(removeErr);
                                res.json({success: false});
                            } else {
                                res.json({success: true});
                            }
                        });
                    }
                });
            } else {
                res.json({success: false});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Shipping client has chosen a request, update to confirming
app.post('/requestConfirming', (req, res) => {
    if (canUserAccess(req.body.token, 2)) {
        var query = 'update request set status = \'Confirming\' where ' +
            'request_id = \'' + req.body.request_id + '\'';
        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.json({success: false});
            } else {
                res.json({success: true});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Shipping client has confirmed, update request status to loading
app.post('/requestLoading', (req, res) => {
    if (canUserAccess(req.body.token, 2)) {
        var query = 'update request set status = \'Loading\' where ' +
            'request_id = \'' + req.body.request_id + '\'';
        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.json({success: false});
            } else {
                res.json({success: true});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Shipping client has confirmed, update request status to loading
app.post('/requestInTransit', (req, res) => {
    if (canUserAccess(req.body.token, 2)) {
        var query = 'update request set status = \'In-Transit\' where ' +
            'request_id = \'' + req.body.request_id + '\'';
        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.json({success: false});
            } else {
                res.json({success: true});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Shipping client has confirmed, update request status to loading
app.post('/requestDelivered', (req, res) => {
    if (canUserAccess(req.body.token, 2)) {
        var query = 'update request set status = \'Delivered\' where ' +
            'request_id = \'' + req.body.request_id + '\'';
        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.json({success: false});
            } else {
                res.json({success: true});
            }
        });
    } else {
        res.sendStatus(403);
    }
});

// Shipping client has confirmed, update request status to loading
app.post('/requestCompleteLine', (req, res) => {
    console.log('request received');
    if (canUserAccess(req.body.token, 2)) {
        var query = 'update request set status = \'Complete\' where ' +
            'request_id = \'' + req.body.request_id + '\'';
        console.log('\n' + query);
        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.json({success: false});
            } else {
                res.json({success: true});
            }
        });
    } else {
        res.sendStatus(403);
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
