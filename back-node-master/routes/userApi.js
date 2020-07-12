var express = require("express");
var userApi = express.Router();
var bcrypt = require("bcrypt");
var dbConn = require("../config/dbConfig");
var jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/check_auth');
const sgMail = require('@sendgrid/mail');
const async = require('async');
const common = require('../config/common');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const fromEmail = process.env.SERVER_EMAIL_ADDRESS;

// #1 === Retrieve all users 
userApi.get('/all', checkAuth, function (req, res) {
    dbConn.query('SELECT * FROM tbl_user', function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        return res.send({ error: false, data: results, message: 'users list.' });
    });
});

// #2 === Retrieve user with id 
userApi.get('/one/:id', checkAuth, function (req, res) {

    let user_id = req.params.id;

    if (!user_id) {
        return res.status(400).send({ error: true, message: 'Please provide user_id' });
    }

    dbConn.query('SELECT * FROM tbl_user where id=?', user_id, function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        return res.send({ error: false, data: results[0], message: 'users list.' });
    });
});

//getting random number 
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// #3 === login user
userApi.post('/signup', function (req, res) {
    let useremail = req.body.useremail;
    let userpassword = req.body.userpassword;
    let username = req.body.username;
    let usergender = req.body.usergender;
    let userlanguage = req.body.language;
    let country = req.body.country;
    let ethnicity = req.body.ethnicity;
    let userBirthData = req.body.birth_date;
    let userlat = req.body.lat_geo;
    let userlong = req.body.long_geo;

    if (!useremail || !userpassword || !username || !usergender || !userlanguage || !country || !ethnicity || !userBirthData || !userlat || !userlong) {
        return res.status(400).send({ error: true, message: 'Please provide all params' });
    }

    dbConn.query('SELECT * FROM tbl_user where email_address=?', useremail, function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        if (results.length) {
            return res.status(400).send({ error: true, message: 'Email is already taken.' });
        } else {
            var newUserSql = {
                email_address: useremail,
                password: bcrypt.hashSync(userpassword, 10, (err, hash) => {
                    return hash;
                }),
                name: username,
                gender: usergender,
                language_id: userlanguage,
                country_id: country,
                ethnicity_id: ethnicity,
                birth_date: userBirthData,
                lat_geo: parseFloat(userlat),
                long_geo: parseFloat(userlong),
                confirmation_code: getRndInteger(100000, 999999),
                created_date: new Date()
            };

            dbConn.query("INSERT INTO tbl_user SET ? ", newUserSql, function (error, results, fields) {
                if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                return res.send({ error: false, data: results.insertId, message: 'New user has been created successfully.' });
            });
        }
    });
});

userApi.get('/checkLoginStatus', checkAuth, function (req, res) {
    var userId = req.userData.userId;
    var joinQuery = 'INNER JOIN tbl_language b on a.language_id=b.id INNER JOIN tbl_ethnicity c ON c.id=a.ethnicity_id INNER JOIN tbl_country d ON a.country_id=d.id';
    dbConn.query('SELECT a.*, TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) AS age, b.language_name, c.ethnicity_name, d.country_name FROM tbl_user a ' + joinQuery + ' WHERE a.id=?', userId, function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        if (!results.length || !results[0])
            return res.status(400).send({ error: true, message: "User doesn't exist." });

        var userData = results[0];
        var accountStatus = userData.account_status;
        if (accountStatus === 8)
            return res.send({error: true, message: 'You have been banned'});
        if (accountStatus === 9)
            return res.send({error: true, message: 'Your account is closed'})
            
        var outputResult = {
            id: results[0].id,
            name: results[0].name,
            email: results[0].email_address,
            age: results[0].age,
            gender: results[0].gender,
            language: results[0].language_name,
            ethnicity: results[0].ethnicity_name,
            country: results[0].country_name,
            email_status: results[0].email_status
        };
        return res.send({ error: false, data: outputResult, message: 'User have been logged in successfully.' });
    });
});

// #4 ===  Add a new user  
userApi.post('/login', function (req, res) {
    let useremail = req.body.useremail;
    let userpassword = req.body.userpassword;
    let deviceId = req.body.deviceId;

    if (!useremail)
        return res.status(400).send({ error: true, message: 'Please provide user email' });
    if (!userpassword)
        return res.status(400).send({ error: true, message: 'Please provide user password' });
    if (!deviceId)
        return res.status(400).send({ error: true, message: 'Device Token Error' });

    var joinQuery = 'INNER JOIN tbl_language b on a.language_id=b.id INNER JOIN tbl_ethnicity c ON c.id=a.ethnicity_id INNER JOIN tbl_country d ON a.country_id=d.id';
    dbConn.query('SELECT a.*, TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) AS age, b.language_name, c.ethnicity_name, d.country_name FROM tbl_user a ' + joinQuery + ' WHERE a.email_address=?', useremail, function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        if (!results.length || !results[0])
            return res.status(400).send({ error: true, message: "Email doesn't exist." });

        var userData = results[0];
        var accountStatus = userData.account_status;
        if (accountStatus === 8)
            return res.send({error: true, message: 'You have been banned'});
        if (accountStatus === 9)
            return res.send({error: true, message: 'Your account is closed'})

        if (!bcrypt.compareSync(userpassword, results[0].password))
            return res.status(400).send({ error: true, message: 'The email or password is invalid,\n please try again' });
        else {
            const token = jwt.sign(
                {
                    email: results[0].email_address,
                    userId: results[0].id,
                    name: results[0].name
                }, process.env.JWT_KEY,
                {
                    expiresIn: '1h'
                }
            );
            var lastLoggedData = {
                user_id: results[0].id,
                ip_address: req.ip,
                created_date: new Date()
            };
            var outputResult = {
                id: results[0].id,
                token: token,
                name: results[0].name,
                email: results[0].email_address,
                age: results[0].age,
                gender: results[0].gender,
                language: results[0].language_name,
                ethnicity: results[0].ethnicity_name,
                country: results[0].country_name,
                email_status: results[0].email_status,
                last_activity: common.commonFunc.timeAgo(results[0].last_loggedin_date)
            };

            dbConn.query('INSERT INTO tbl_user_login SET ? ', lastLoggedData, function (error, newResults, fields) {
                if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

                dbConn.query('UPDATE tbl_user SET last_loggedin_date=?, device_id=? WHERE id=? ', [new Date(), deviceId, results[0].id], function (error1, updateResult, fields) {
                    if (error1) return res.status(400).send({ error: true, detail: error1.code, message: error1.sqlMessage });
                    return res.send({ error: false, data: outputResult, message: 'User have been logged in successfully.' });
                });
            });
        }
    });
});

userApi.post('/logout', checkAuth, function (req, res) {
    return res.send({ error: false, message: 'User has been logged out successfully.' });
});


// #5 ===  Update user with id
userApi.put('/updateSetting', checkAuth, function (req, res) {
    var userId = req.userData.userId;
    var updateData = {
        updated_date: new Date()
    };

    if (req.body.name) {
        updateData.name = req.body.name;
    }
    if (req.body.languageId) {
        updateData.language_id = req.body.languageId;
    }
    if (req.body.countryId) {
        updateData.country_id = req.body.countryId;
    }
    if (req.body.ethnicityId) {
        updateData.ethnicity_id = req.body.ethnicityId;
    }
    if (req.body.latGeo) {
        updateData.lat_geo = req.body.latGeo;
    }
    if (req.body.longGeo) {
        updateData.long_geo = req.body.longGeo;
    }

    dbConn.query("UPDATE tbl_user SET ? WHERE id=?", [updateData, userId], function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

        var joingQuery = 'INNER JOIN tbl_ethnicity b ON a.ethnicity_id=b.id INNER JOIN tbl_language c ON a.language_id=c.id INNER JOIN tbl_country d ON a.country_id=d.id';

        dbConn.query("SELECT a.name, TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) AS age, a.birth_date, a.email_address, a.gender, a.lat_geo, a.long_geo, a.last_loggedin_date, a.updated_date, a.created_date, b.ethnicity_name, c.language_name, d.country_name FROM tbl_user a " + joingQuery + " WHERE a.id=?", userId, function (error1, updatedUser, fields) {
            if (error1) return res.status(400).send({ error: true, detail: error1.code, message: error1.sqlMessage });
            return res.send({ error: false, data: updatedUser, message: 'User has been updated successfully.' });
        });
    });
});


// #6 ===  Delete user
userApi.post('/removeAccount', checkAuth, function (req, res) {
    let user_id = req.userData.userId;

    dbConn.query('SELECT * FROM tbl_user WHERE id=?', [user_id], function (error1, oldResults, fields) {
        if (error1) return res.status(400).send({ error: true, detail: error1.code, message: error1.sqlMessage });

        if (!oldResults.length) return res.send({ error: false, message: 'User not found.' });

        dbConn.query('UPDATE tbl_user SET account_status=9 WHERE id=?', user_id, function (error2, results, fields) {
            if (error2) return res.status(400).send({ error: true, detail: error2.code, message: error2.sqlMessage });
            return res.send({ error: false, data: results, message: 'User has been removed successfully.' });
        });
    });
});

//#7 === uc5.2 display filter gender/ location/ age
userApi.post('/filter', checkAuth, function (req, res) {
    let gender = req.body.gender;
    let latGeo = req.body.lat_geo;
    let longGeo = req.body.long_geo;
    let age = req.body.age;

    let now = new Date();
    let nowYear = now.getFullYear();
    let birthYear = nowYear - age;
    let birthDate = new Date(birthYear.toString());

    dbConn.query('SELECT * FROM tbl_user where gender = ? AND lat_geo = ? AND long_geo = ? AND birth_date <= ?', [gender, latGeo, longGeo, birthDate], function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        return res.send({ error: false, data: results, message: 'Filtered user list' });
    });
});

// #8 === My Settings Page - display my settings
userApi.get('/displayMySetting', checkAuth, function (req, res) {
    var userId = req.userData.userId;

    var joinQuery = 'INNER JOIN tbl_country b ON a.country_id = b.id INNER JOIN tbl_language c ON a.language_id = c.id INNER JOIN tbl_ethnicity d ON a.ethnicity_id=d.id';

    dbConn.query('SELECT a.name, a.gender, a.birth_date, b.country_name, c.language_name, d.ethnicity_name FROM tbl_user a ' + joinQuery + ' WHERE a.id=? ', userId, function (error, results) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        if (!results.length)
            return res.status(403).send({ error: true, message: 'user not found' });

        var userBirth = results[0].birth_date;
        var birthYear = new Date(userBirth).getFullYear();
        var nowDate = new Date();
        var nowYear = nowDate.getFullYear();
        var age = nowYear - birthYear;
        var userData = results[0];
        userData.age = age;
        return res.send({ error: false, data: userData, message: 'User Setting Information' });
    });
});

/*  sendgrid email sending */

function sendEmail(parentCallback, fromEmail, toEmails, subject, textContent, htmlContent) {
    const errorEmails = [];
    const successfulEmails = [];

    async.parallel([
        function (callback) {
            // Add to emails
            const msg = {
                to: toEmails,
                from: fromEmail,
                subject: subject,
                text: textContent,
                html: htmlContent,
            };
            sgMail.send(msg);
            // return
            callback(null, true);
        }
    ], function (err, results) {
        return err;
    });
    parentCallback(null,
        {
            successfulEmails: successfulEmails,
            errorEmails: errorEmails,
        }
    );
}


userApi.post('/sendConfirmEmail', checkAuth, function (req, res) {

    var userId = req.userData.userId;
    var toEmail = req.userData.email;
    var name = req.userData.name;

    dbConn.query('SELECT * FROM tbl_user WHERE id=? AND (email_status=0 or email_status=2) AND account_status=0', userId, function (error, emailResults, fields) {
        if (error)
            return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

        if (!emailResults.length)
            return res.status(403).send({ error: true, data: emailResults, message: 'User not found.' });

        var confirmationCode = emailResults[0].confirmation_code;

        if (!confirmationCode) return res.status(403).send({ error: false, message: 'Confirmation Code not found.' });

        async.parallel(
            [
                function (callback) {
                    sendEmail(
                        callback,
                        fromEmail,
                        toEmail,
                        'confirmation code : ' + confirmationCode + ' DazzledDate.com',
                        'Please verify your email address',
                        "<p><b>Hi, " + name + " </b></p> <p> This is your confirmation code : <strong style='font-size: 25px;'>" + confirmationCode + "</strong></p>"
                    );
                }
            ], function (err, results) {
                if (err) {
                    res.status(403).send({ error: true, detail: err, message: 'Sending Email Faild' });
                }
                if (results) {
                    var userUpdateData = {
                        updated_date: new Date(),
                        email_status: 2
                    };
                    dbConn.query('UPDATE tbl_user SET ? WHERE id=? AND email_status=0 AND account_status=0', [userUpdateData, userId], function (error1, updateResult, fields) {
                        if (error1) return res.status(400).send({ error: true, detail: error1.code, message: error1.sqlMessage });

                        res.send({
                            error: false,
                            message: 'Emails sent'
                        });
                    });
                }
            });
    });
});

// user email verification api
userApi.post('/emailVerify', checkAuth, function (req, res) {
    var userId = req.userData.userId;
    var userEmail = req.userData.email;
    var confirmCode = req.body.confirmCode;

    if (!confirmCode) return res.status(403).send({ error: true, message: 'Confirmation Code Not Found.' });

    dbConn.query('SELECT * from tbl_user WHERE email_address=? AND account_status=0 AND (email_status=2 OR email_status=0)', userEmail, function (error, getResult, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

        if (!getResult.length) return res.status(403).send({ error: true, message: 'User is not registered!' });
        var dbConfirmationCode = getResult[0].confirmation_code;

        if (parseInt(confirmCode) === parseInt(dbConfirmationCode)) {
            var updateData = {
                updated_date: new Date(),
                email_status: 1,
                account_status: 1,
                confirmation_code: getRndInteger(100000, 999999)
            };

            dbConn.query('UPDATE tbl_user SET ? WHERE id=?', [updateData, userId], function (error1, updateResult, updateFields) {
                if (error1) return res.status(400).send({ error: true, detail: error1.code, message: error1.sqlMessage });
                res.send({ error: false, email: userEmail, message: 'Email has been successfully verified.' });
            });
        } else {
            return res.send({ error: true, message: 'Confirmation code is not correct.' });
        }
    });
});

module.exports = userApi;