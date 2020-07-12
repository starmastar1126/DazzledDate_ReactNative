const express = require('express');
var app = express();
const expressip = require('express-ip');
var bodyParser = require('body-parser');
const async = require('async');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(expressip().getIpInfoMiddleware);
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
    next();
});

const dbConn = require('./config/dbConfig');
const sendEmail = require('./config/mailConfig').sendEmail;
const fromEmail = process.env.SERVER_EMAIL_ADDRESS;

// default route
app.get('/', function (req, res) {
    return res.send({ error: true, message: 'hello' })
});

var userApi = require('./routes/userApi');
var videoApi = require('./routes/videoApi');
var matchApi = require('./routes/matchApi').matchApi;
var languageApi = require('./routes/languageApi');
var countryApi = require('./routes/countryApi');
var ethnicityApi = require('./routes/ethnicityApi');
var chatApi = require('./routes/chatApi');

const storageApi = require('./routes/storageApi');

//----- *  user password reset apis * ------//
//user reset password request api
app.post('/requestResetPassword', function(req, res) {   
    var toEmail = req.body.email;
    if (!toEmail) return res.status(400).send({error: true, message: 'Please provide reset email address'});

    dbConn.query("SELECT id FROM tbl_user WHERE email_address=? ", toEmail, function(error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        if (!results.length) return res.status(403).send({error: true, message: 'Email address does not exist.'});
        const token = jwt.sign(
            {
                email: toEmail
            }, process.env.EMAIL_SECRET_KEY,
            {
                expiresIn: 1000 * 60 * 60 * 10
            }
        );
        const confirmLink = "https://dazzleddate.com/confirm/" + token;
        async.parallel(
            [
                function (callback) {
                    sendEmail(
                        callback,
                        fromEmail,
                        toEmail,
                        'Resetting Password',
                        'Do you want to change your passsword?',
                        "Hello,<br> Please Click on the link to reset your password.<br><a href="+confirmLink+">Click here to reset your password</a>" 
                    );
                }
            ], function(err, results) {
            if (err) return res.status(403).send({error: true, detail: err, message: 'Sending Email Faild'});
            
            return res.send({
                error: false,
                message: 'Emails sent'
            });
        });
    });    
});

//reset user password
app.put('/resetPassword/:token', function(req, res) {
    try {
        const token = req.params.token;
        jwt.verify(token, process.env.EMAIL_SECRET_KEY, function(error, decoded) {
            if (error) return res.send({error: true, message: 'Reset Session Expired.'});
            var decode = decoded;
       
            if (!decode) return res.send({error: true, message: 'Invalid Token.'});
            const resetEmail = decode.email;

            var newPassword = req.body.password;
            if (!newPassword) return res.status(403).send({error: true, message: 'please provide password.'});

            var updateData = {
                password: bcrypt.hashSync(newPassword, 10, (err, hash) => {
                    return hash;
                }),
                updated_date: new Date()
            };
            dbConn.query('UPDATE tbl_user SET ? WHERE email_address=?', [updateData, resetEmail], function(error1, updateResult, updateFeidls) {
                if (error1) return res.status(400).send({error: true, detail:error1.code, message: error1.sqlMessage});
                async.parallel(
                    [
                        function (callback) {
                            sendEmail(
                                callback,
                                fromEmail,
                                resetEmail,
                                'Resetting Password',
                                'Do you want to change your passsword?',
                                "<p><b> Dear, Your Password was recently changed</b></p><p>This email confirms that you recently changed the password for your account. No further action is required.</p><br>" 
                            );
                        }
                    ], function(err, results) {
                    if (err) return res.send({error: true, message: 'Sending email failed!'});
                    
                    return res.send({error: false, message: 'Success! Please try to login again!'});
                });
            });
        });
    } catch (error) {
        return res.status(401).send({
            message: 'Session Expired.'
        });
    }
});
//----- *  user password reset apis end * ------//

//routers
app.use('/api/user', userApi);
app.use('/api/video', videoApi);
app.use('/api/match', matchApi);
app.use('/api/language', languageApi);
app.use('/api/country', countryApi);
app.use('/api/ethnicity', ethnicityApi);
app.use('/api/chat', chatApi);
app.use('/api/storage', storageApi)

module.exports = app;