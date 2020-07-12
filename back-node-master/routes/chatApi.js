var express = require("express");
var chatApi = express.Router();
var dbConn = require("../config/dbConfig");
const checkAuth = require('../middleware/check_auth');
const blockFunction = require("./matchApi").blockFunction;
const commonFunc = require('../config/common').commonFunc;
var FCM = require('fcm-node');

//#29 UC9 Chat Api == UC9.1 Display Chat - Main list
chatApi.get('/all', checkAuth, function(req, res) {
    var userId = req.userData.userId;

    var joinQuery = 'inner join tbl_chat d on c.chat_id=d.id inner join tbl_user e on c.other_user_id=e.id inner join tbl_video g on g.user_id=e.id where g.is_primary=1 order by d.created_date desc';
    var matchWhereCondition = 'a.main_user_id=? and a.status in (6,7) and a.publish=1 and f.publish=1 and f.is_primary=1 group by a.id';
    var matchJoinQuery = 'inner join tbl_chat b on a.id=b.match_id inner join tbl_video f on f.user_id=a.other_user_id ';
    var matchQuery = 'SELECT a.id as match_id, max(b.id) as chat_id, a.other_user_id as other_user_id FROM `tbl_match` a '+matchJoinQuery+' where ' +matchWhereCondition;
    var queryString = 'select c.*, d.message_text, d.created_date as created_date, e.name, e.gender, e.birth_date, TIMESTAMPDIFF(YEAR, e.birth_date, CURDATE()) AS age, g.cdn_id, g.cdn_filtered_id from ('+matchQuery+') c ' + joinQuery;
   
    dbConn.query(queryString, userId, function(error, results, fields){
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});

        results.forEach(chat => {
            chat.time_ago = commonFunc.timeAgo(chat.created_date);
        });
        return res.send({ error: false, data: results, message: "Get All Chat List"});
    });
});

//30 UC9.2  Display Chat - display chat content for the selected match_id
chatApi.get('/getChatWithMatchId/:matchId', checkAuth, function(req,res) {
    var userId = req.userData.userId;
    var matchId = req.params.matchId;

    if (!matchId)
        return res.send({error: true, message: 'Invalid Match Param.'});

    var whereCondition = 'a.match_id=? and (b.main_user_id=? or b.other_user_id=?)';
    
    dbConn.query('Select a.*, b.mutual_match_id from tbl_chat as a inner join tbl_match as b on a.match_id=b.id where '+whereCondition+' order by created_date asc', [matchId, userId, userId], function(error, results, fields){
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        
        //get other user detail information from match id
        dbConn.query('SELECT a.name, a.gender, a.birth_date, c.cdn_id, TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) AS age from tbl_user as a inner join tbl_match as b on a.id=b.other_user_id inner join tbl_video c on a.id=c.user_id where b.id=? and (b.main_user_id=? or b.other_user_id=?) and a.account_status=1 and c.is_primary=1 and c.is_reply=0 and c.publish=1', [matchId, userId, userId], function(error1, userResults, fields) {
            if (error1) return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});
            if (!userResults.length) return res.status(403).send({error: false, message: 'Match Data not found'});
            var matchedOtherUser = userResults[0];
            return res.send({ error: false, data: {user: matchedOtherUser, content: results}, message: "Get All Chat List With Match Id: " + matchId});
        });
    });
});

//31 UC9.3 Create a new Chat Text 
chatApi.post('/create', checkAuth, function(req, res) {
    var userId = req.userData.userId;
    var matchId = req.body.matchId;
    var messageText = req.body.messageText;
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    const fcm = new FCM(serverKey);

    if (!matchId || !messageText) {
        return res.status(400).send({ error:true, message: 'Invalid Params.'}); 
    }

    dbConn.query('Select mutual_match_id from tbl_match where id=?', [matchId], function(err, matchResults, fields) {
        if (err) return res.status(400).send({error: true, detail: err.code, message: err.sqlMessage});;
        if (!matchResults.length)
            return res.status(400).send({ error:true, message: 'No Match Found'});

        var mutualMatchId = matchResults[0].mutual_match_id;
        var sendMsg = {
            match_id: matchId,
            message_type: 1,
            message_text: messageText,
            created_date: new Date()
        };
        dbConn.beginTransaction(function(error){
            if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
            dbConn.query('INSERT INTO tbl_chat set ? ', [sendMsg], function(error, sendResult) {
                if (error) {
                    dbConn.rollback(function(){
                        return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                    });
                }
                var receiveMsg = {
                    match_id: mutualMatchId,
                    message_type: 2,
                    message_text: messageText,
                    created_date: new Date()
                };
                dbConn.query('INSERT INTO tbl_chat set ? ', [receiveMsg], function(error, receiveResult) {
                    if (error) {
                        dbConn.rollback(function() {
                            return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                        });
                    }
                    dbConn.commit(function(error) {
                        if (error) {
                            dbConn.rollback(function() {
                                return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                            });
                        }

                        dbConn.query('SELECT * FROM tbl_user a INNER JOIN tbl_match b ON a.id=b.main_user_id WHERE b.id=?', mutualMatchId, function(error1, receiver, receiverFields) {
                            if (error1) return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});
                            if (!receiver.length) res.status(400).send({ error:true, message: 'Receiver data not found.'});
                            const receiverData = receiver[0];
                            if (!receiverData.device_id) return res.status(400).send({error: true, message: 'firebase token not found'});
                            const deviceId = receiverData.device_id;
                            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                                to: deviceId,                                
                                notification: {
                                    title: 'New Message',
                                    body: messageText,
                                },
                                data: {  //you can send only notification or only data(or include both)
                                    type: 'ChatDetail'
                                }
                            };
                            fcm.send(message, function(notiErr, notiRes){
                                if (notiErr) {
                                    console.log("Something has gone wrong!");
                                    return res.status({error: false, data: {sendResult, receiverResult}, message: 'New message created, notification error', notificationError: err})
                                } else {
                                    console.log("Successfully sent with response: ", notiRes);
                                    return res.send({ error: false, data: {sendResult, receiveResult}, message: "New Message is Created."});
                                }
                            });
                        });
                    });
                });
            });
        });
    });    
});

//#32 UC 10.1 Report - hide from display once blocked
chatApi.post('/reportUser', checkAuth, blockFunction, function(req, res) {
    var userId = req.userData.userId;
    var otherId = req.body.otherId;
    var matchId = req.oldData ? req.oldData.id : req.matchId;
    
    var reportDescription = req.body.reportDescription;
    
    if (!otherId) {
        return res.status(400).send({ error:true, message: 'Invalid Other Id.'});  
    };
    if (!reportDescription) {
        return res.status(400).send({ error:true, message: 'Invalid Report Description.'});
    }
    dbConn.query("SELECT * FROM tbl_report WHERE user_id_submitted=? AND user_id_violated=? AND tbl_match_id=? ", [userId, otherId, matchId], function(error, results, feilds) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        if (results.length) return res.status(403).send({error: true, data: results[0], message: 'Report data already exist.'});

        var sendReportData = {
            user_id_submitted: userId,
            user_id_violated: otherId,
            tbl_match_id: matchId,
            report_description: reportDescription,
            report_status: 8,
            created_date: new Date(),
            admin_comment: ''
        };
    
        dbConn.beginTransaction(function(error){
            if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
            dbConn.query('INSERT INTO tbl_report set ? ', [sendReportData], function(error, sendResult) {
                if (error) {
                    dbConn.rollback(function(){
                        return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                    });
                }
                var receiveReportData = {
                    user_id_submitted: otherId,
                    user_id_violated: userId,
                    tbl_match_id: matchId,
                    report_description: reportDescription,
                    report_status: 9,
                    created_date: new Date(),
                    admin_comment: ''
                };
                dbConn.query('INSERT INTO tbl_report set ? ', [receiveReportData], function(error, receiveResult) {
                    if (error) {
                        dbConn.rollback(function() {
                            return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                        });
                    };
    
                    dbConn.commit(function(error) {
                        if (error) {
                            dbConn.rollback(function() {
                                return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                            });
                        };
    
                        return res.send({ error: false, data: {sender_report_id: sendResult.insertId, receiver_report_id: receiveResult.insertId}, message: "New Report is Created."});
                    });
                });
            });
        });
    });    
});

//#33 UC 11 = block user from chat
chatApi.post('/blockChat', checkAuth, function(req, res) {
    var userId = req.userData.userId;
    var otherId = req.body.otherId;

    if (!otherId) {
		return res.status(400).send({ error:true, message: 'Please provide other user id' });
    }  

    var userBlockData = {
        main_user_id: userId,
        other_user_id: otherId,
        status: 8,
        status_description: 'block_chat',
        created_date: new Date(),
        updated_date: new Date()
    };

    dbConn.beginTransaction(function(error){
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});;
        dbConn.query('INSERT INTO tbl_match set ? ', [userBlockData], function(error, sendResult) {
            if (error) {
                dbConn.rollback(function(){
                    return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                });
            }
            var blockReplyData = {
                main_user_id: otherId,
                other_user_id: userId,
                status: 9,
                mutual_match_id: sendResult.insertId,
                status_description: 'block_chat_receive',
                created_date: new Date(),
                updated_date: new Date()
            }
            dbConn.query('INSERT INTO tbl_match set ? ', [blockReplyData], function(error, receiveResult) {
                if (error) {
                    dbConn.rollback(function() {
                        return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                    });
                };
                dbConn.query("UPDATE tbl_match SET mutual_match_id = ? WHERE main_user_id = ? and other_user_id=? and status=8", [receiveResult.insertId, userId, otherId], function (error, results, fields) {
                    if (error) {
                        dbConn.rollback(function() {
                            return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                        });
                    };
                    dbConn.query("SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND publish=?", [userId, otherId, 1], function(error, results, fields) {
                        if (error) {
                            dbConn.rollback(function() {
                                return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                            });
                        };
                        if (!results.length)
                            return res.status(400).send({ error:true, message: 'Match data cannot be found.'});
                        var matchId = results[0].id;
                        dbConn.query("UPDATE tbl_match SET publish=0 WHERE id=?", [matchId], function(error, results, fields) {
                            if (error) {
                                dbConn.rollback(function() {
                                    return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                                });
                            }
                            dbConn.query("SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND publish=?", [otherId, userId, 1], function(error, results, fields) {
                                if (error) {
                                    dbConn.rollback(function() {
                                        return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                                    });
                                }
                                if (!results.length)
                                    return res.status(400).send({ error:true, message: 'Match data cannot be found.'});
                                var otherMatchId = results[0].id
                                dbConn.query("UPDATE tbl_match SET publish=0 WHERE id=?", [otherMatchId], function(error, results, fields) {
                                    if (error) {
                                        dbConn.rollback(function() {
                                            return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                                        });
                                    }
                                    dbConn.commit(function(error) {
                                        if (error) {
                                            dbConn.rollback(function() {
                                                return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
                                            });
                                        };
                                        return res.send({ error: false, data: {sendResult, receiveResult}, message: "New Block Created"});
                                    });
                                });
                            });
                        });
                    });                    
                });
            });
        });
    });    
});

module.exports = chatApi;

