var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var hash = require('crypto-js');
var fs = require('fs');
var nodemailer = require('nodemailer');
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
var verifyRouter = require('./routes/verifyRouter.js');

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
app.use('/new/user', registerRouter);
app.use('/line', lineRouter);
app.use('/shipping', shippingRouter);
app.use('/setup/line', lineSetupRouter);
app.use('/setup/shipping', shippingSetupRouter);
app.use('/status', statusRouter);
app.use('/materials', matsRouter);
app.use('/users', usersRouter);
app.use('/verification', verifyRouter);

function getTimestamp() {
    var date = new Date();
    return date.getHours() + ':' + date.getMinutes() + ':' +
        date.getSeconds();
}

// Method to verify user can access page
function canUserAccess(token, level) {
    var payload = jwt.verify(token, secretKey);
    if (payload.access_level >= level) {
        return true;
    } else {
        return false;
    }
}

// Method to get a users access level from a token
function getUserLevel(token) {
    return jwt.verify(token, secretKey).access_level;
}

// Method to get a users email from a token
function getUserEmail(token) {
    return jwt.verify(token, secretKey).email;
}

// POST and GET backend methods ***********************************************

// Verify login details, and create jwt if correct
app.post('/verifyLogin', (req, res) => {
    // Check if user exists with the given email
    var query = 'select * from employee, employee_office where ' +
        'employee.employee_id = employee_office.employee_id and email = \'' +
        req.body.email + '\'';
    client.query(query, (err, result) => {
        if (err) console.log(err);
        if (result.rows.length > 0) {
            // User exists, check passwords using DB stored salt
            console.log(req.body.password);
            var preHash = req.body.password + result.rows[0].salt;
            var formPassword = hash.SHA256(preHash).toString(hash.enc.Hex);
            console.log(result.rows[0].salt);
            console.log(formPassword);

            if (formPassword == result.rows[0].password) {
                // Passwords match, generate a token and send it to client
                var payload = {
                    first_name: result.rows[0].first_name,
                    surname: result.rows[0].surname,
                    position: result.rows[0].position,
                    email: result.rows[0].email,
                    date_registered: result.rows[0].date_registered,
                    access_level: result.rows[0].access_level
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
        console.log(err);
        console.log(getTimestamp(req) + 'Error verifying token');
        res.json({success: false});
    }
});

// Client requesting a list of all lines
app.get('/getLines', (req, res) => {
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
});

// Client requesting a list of all line modes given a line number
app.post('/getLineModes', (req, res) => {
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
});

// Client requesting a list of all materials given a line number and mode
app.post('/getMaterials', (req, res) => {
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
});

// Client is requesting the material id for a given line, mode, and material name
app.post('/getMaterialLineID', (req, res) => {
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
});

// Client is requesting line information given a material ID
app.post('/getLineInfo', (req, res) => {
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
});

// Client from shipping is requesting line information given a request ID
app.post('/getLineInfoShipping', (req, res) => {
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
});

// Client is request list of all requests
app.post('/getAllStatusRequest', (req, res) => {
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
});

// Client is request list of all active requests
app.post('/getActiveRequests', (req, res) => {
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
});

app.post('/newRequest', (req, res) => {
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
});

// Client is requesting the status of a request given the ID
app.post('/statusUpdateLine', (req, res) => {
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
});

// Request has been confirmed by both parties, so close it
app.post('/requestCompleteShipping', (req, res) => {
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
});

// Shipping client has chosen a request, update to confirming
app.post('/requestConfirming', (req, res) => {
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
});

// Shipping client has confirmed, update request status to loading
app.post('/requestLoading', (req, res) => {
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
});

// Shipping client has confirmed, update request status to loading
app.post('/requestInTransit', (req, res) => {
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
});

// Shipping client has confirmed, update request status to loading
app.post('/requestDelivered', (req, res) => {
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
});

// Shipping client has confirmed, update request status to loading
app.post('/requestCompleteLine', (req, res) => {
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
});

// Client is requesting a list of users
app.post('/getUsers', (req, res) => {
    var query = 'select * from employee, employee_office where ' +
        'employee.employee_id = employee_office.employee_id';
    client.query(query, (err, result) => {
        if (err) {
            console.log(err);
            res.json({success: false});
        } else {
            
            res.json({success: true, users: result.rows});
        }
    });
});

// Client is requesting to delete a user
app.post('/deleteUser', (req, res) => {
    // Have to get the user information for the insert statement into old_users
    var getQuery = 'select * from employee where first_name=\'' +
        req.body.userData.first_name + '\' and surname=\'' +
        req.body.userData.surname + '\' and email=\'' +
        req.body.userData.email + '\' and date_registered=\'' +
        req.body.userData.date_registered + '\'';
    client.query(getQuery, (getErr, getResult) => {
        if (getErr) {
            console.log(getErr);
            res.json({success: false});
        } else {
            if (getResult.rows.length > 0) {
                var info = getResult.rows[0];

                // Get date
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1; //January is 0!
                var yyyy = today.getFullYear();
                if (dd < 10)
                    dd = '0' + dd;
                if (mm < 10)
                    mm = '0' + mm;
                var date = dd + '/' + mm + '/' + yyyy;

                var insertQuery = 'insert into old_users (first_name, ' +
                    'surname, email, position, salary, date_registered, ' +
                    'date_removed) values (\'' + info.first_name + '\', \'' +
                    info.surname + '\', \'' + info.email + '\', \'' +
                    info.position + '\', \'' + info.pay + '\', \'' +
                    info.date_registered + '\', \'' + date + '\');';
                client.query(insertQuery, (insertErr, insertResult) => {
                    if (insertErr) {
                        console.log(insertErr);
                        res.json({success: false});
                    } else {
                        // Check if user is an office employee
                        var checkQuery = 'select * from employee_office ' +
                            'where employee_id=\'' + info.employee_id + '\'';
                        client.query(checkQuery, (checkErr, checkResult) => {
                            if (checkErr) {
                                console.log(checkErr);
                                res.json({success: false});
                            } else {
                                if (checkResult.rows.length > 0) {
                                    // There is an office employee entry for this user
                                    // Delete it
                                    var delOfficeQuery = 'delete from ' +
                                        'employee_office where ' +
                                        'employee_id=\'' + info.employee_id + '\'';
                                    client.query(delOfficeQuery, (delErr, delResult) => {
                                        if (delErr) {
                                            console.log(delErr);
                                            res.json({success: false});
                                        } else {
                                            // Delete the user from employee
                                            var query = 'delete from employee where employee_id=\'' + info.employee_id + '\'';
                                            client.query(query, (err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                    res.json({success: false});
                                                } else {
                                                    console.log('User successfully deleted');
                                                    res.json({success: true});
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });                            
                    }
                });
            }
        }
    });
});

app.post('/verifyUser', (req, res) => {
    // Get employee token
    var tokenQuery = 'select token from employee where employee_id=\'' + req.body.employee_id + '\'';
    client.query(tokenQuery, (tokenErr, tokenResult) => {
        if (tokenErr) {
            console.log(tokenErr);
            res.json({success: false});
        } else {
            if (tokenResult.rows.length > 0) {
                // Check if tokens match
                if (req.body.token == tokenResult.rows[0].token) {
                    // Tokens match, update user info
                    var query = 'update employee set token=NULL and ' +
                        'verified=true where employee_id=\'' + req.body.employee_id + '\'';
                    client.query(query, (err, result) => {
                        if (err) {
                            console.log(err);
                            res.json({success: false});
                        } else {
                            // Update complete, determine if we need an office account
                            if (req.body.office == 'true') {
                                // Create an employee_office with the password given

                                // Generate a random salt, and hash the password
                                var saltRandom = hash.lib.WordArray.random(128 / 8);
                                var salt = hash.SHA256(saltRandom);
                                var pass = hash.SHA256(req.body.password + salt);

                                var insertQuery = 'insert into employee_office' +
                                    ' (employee_id, password, salt, ' +
                                    'access_level) values (' + req.body.employee_id +
                                    ', \'' + pass + '\', \'' + salt + '\', ' + 
                                    req.body.access_level + ');';
                                client.query(insertQuery, (insertErr, insertResult) => {
                                    if (insertErr) {
                                        console.log(insertErr);
                                        res.json({success: false});
                                    } else {
                                        // Finished verification for this user
                                        console.log('Verification of level 3 user complete');
                                        res.json({success: true});
                                    }
                                });
                            } else {
                                // Finished verification for this user
                                console.log('Verification of level 1 user complete');
                                res.json({success: true});
                            }
                        }
                    });
                }
            } else {
                console.log('No user found with given id ' + req.body.id);
                res.json({success: false});
            }
        }
    });
});

// Client is submitting a new user
app.post('/newUser', (req, res) => {
    if (canUserAccess(req.body.token, 3)) {

        // Get the website host for generating a verification link later
        var host = '';
        fs.readFile('serverURL.txt', 'utf8', (err, data) => {
            if (err) console.log(err);
            host = data;
        });

        // Generate the proper date format for employee entry
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10)
            dd = '0' + dd;
        if (mm < 10)
            mm = '0' + mm;
        var date = dd + '/' + mm + '/' + yyyy;

        // Insert user into DB unverified
        var insertQuery = 'insert into employee (first_name, surname, email,' +
            ' pay, position, date_registered, photo_url, verified, token, office) ' +
            'values (\'' + req.body.first_name + '\', \'' + req.body.surname +
            '\', \'' + req.body.email + '\', \'' + req.body.pay + '\', \'' + 
            req.body.position + '\', \'' + date + '\', null, false, null, \'' + req.body.office + '\')'; 
        client.query(insertQuery, (insertErr, insertResult) => {
            if (insertErr) {
                console.log(insertErr);
                res.json({success: false});
            } else {
                // Get the employee_id from the new entry
                var query = 'select employee_id from employee where first_name=\'' + 
                    req.body.first_name + '\' and surname=\'' + req.body.surname + 
                    '\' and email=\'' + req.body.email + '\'';
                client.query(query, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.json({success: false});
                    } else {
                        if (result.rows.length > 0) {
                            // Generate a web token to store info, and to use
                            // for verification later
                            var payload;
                            // If the user type has a password, include the
                            // password and access level in the payload
                            if (req.body.type == 'Office') {
                                payload = {
                                    employee_id: result.rows[0].employee_id,
                                    office: true,
                                    access_level: 3
                                };
                            } else {
                                payload = {
                                    employee_id: result.rows[0].employee_id,
                                };
                            }
                            var userToken = jwt.sign(payload, secretKey);

                            // Add the token to the employee entry
                            var updateQuery = 'update employee set token=\'' +
                                userToken + '\' where employee_id=\'' + 
                                result.rows[0].employee_id + '\'';
                            client.query(updateQuery, (updateErr, updateResult) => {
                                if (updateErr) {
                                    console.log(updateErr);
                                    res.json({success: false});
                                } else {
                                    // Create the verification link
                                    var link = host + 'verification?token=' + userToken;
                                    
                                    // Gmail transporter setup
                                    var transporter = nodemailer.createTransport({
                                        service: 'gmail',
                                        auth: {
                                            user: 'autoneum.london.images@gmail.com',
                                            pass: 'mplkO0935'
                                        }
                                    });

                                    // If a job position was defined, use it in the email
                                    var greetLine = 'We are happy to have you on board.';
                                    if (req.body.position != '') {
                                        greetLine = 'We are happy to have you on board as our new ' + req.body.position + '.';
                                    }

                                    // Create a timestamp
                                    var today = new Date();
                                    var dd = today.getDate();
                                    var mm = today.getMonth() + 1; //January is 0!
                                    var yyyy = today.getFullYear();
                                    if (dd < 10)
                                        dd = '0' + dd;
                                    if (mm < 10)
                                        mm = '0' + mm;
                                    var date = dd + '/' + mm + '/' + yyyy;

                                    var hh = today.getHours();
                                    var min = today.getMinutes();
                                    var ss = today.getSeconds();
                                    if (hh < 10)
                                        hh = '0' + hh;
                                    if (min < 10)
                                        min = '0' + min;
                                    if (ss < 10)
                                        ss = '0' + ss;
                                    var time = hh + min + ss;
                                    var timestamp = 'Sent on ' + date + ' at ' + time;
                                    

                                    // What to send to the new user
                                    var mailOptions = {
                                        from: 'autoneum.london.images@gmail.com',
                                        to: req.body.email,
                                        subject: 'Autoneum - Email Confirmation',
                                        html: '<div id="container" style="width: 50%; margin: 0 auto; text-align: center;">' +
                                            '<img src="https://i.ibb.co/tBT5SfK/autoneum.jpg" width="344" height="48"/>' +
                                            '<h2 style="color: #9FCF15; margin-top: 0; font-size: 40px; font-weight: bold;">London</h3>' +
                                            '<h4 style="font-size: 25px">Welcome to Autoneum ' + req.body.first_name + '!</h4>' +
                                            '<h5 style="margin-bottom: 0; font-size: 20px">' + greetLine + '</h5>' +
                                            '<h5 style="margin-top: 0; font-size: 20px">Just follow the link below to complete your registration, and we\'ll see you on Monday!</h5>' +
                                            '<a style="font-size: 20px" href="' + link + '">Complete Registration</a>' +
                                            '<p>' + timestamp + '</p></div>'
                                    };
                                    // Send the email
                                    transporter.sendMail(mailOptions, function (err, info) {
                                        if(err)
                                          console.log(err)
                                        else
                                          console.log(info);
                                    });

                                    res.json({success: true});
                                }
                            });

                        } else {
                            console.log('No result for ID fetch');
                            res.json({success: false});
                        }
                    }
                });
            }
        });
    } else {
        res.sendStatus(403);
    }
});

app.post('/getAllMaterials', (req, res) => {
    if (canUserAccess(req.body.token, 3)) {
        var query = 'select code, name, colour, count, sap_count, pack_size, ' +
            'number, line_mode from material, line where material.line_id = ' +
            'line.line_id';
        client.query(query, (err, result) => {
            if (err) {
                console.log(err);
                res.json({success: false});
            } else {
                res.json({
                    success: true,
                    materials: result.rows
                });
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
