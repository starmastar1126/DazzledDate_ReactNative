var express = require("express");
var matchApi = express.Router();
var dbConn = require("../config/dbConfig");
const checkAuth = require('../middleware/check_auth');
const commonFunc = require('../config/common').commonFunc;
var FCM = require('fcm-node');
const serverKey = process.env.FIREBASE_SERVER_KEY;
const fcm = new FCM(serverKey);

// #11 === set new match data
matchApi.post('/view', checkAuth, function (req, res) {

    if (!req.body.other_user_id) {
        return res.status(400).send({ error: true, message: 'Please provide other user id' });
    }

    var newMatchSql = {
        main_user_id: req.userData.userId,
        other_user_id: req.body.other_user_id,
        status: req.body.status ? req.body.status : 0,
        status_description: req.body.status_description ? req.body.status_description : 'viewed',
        publish: 1,
        created_date: new Date(),
        updated_date: new Date()
    };

    dbConn.query("INSERT INTO tbl_match SET ? ", newMatchSql, function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        return res.send({ error: false, data: results.insertId, message: 'New match has been created.' });
    });
});

// #12 === main user “hearts” other user’s video ===
matchApi.post('/like', checkAuth, function (req, res) {
    var userId = req.userData.userId;
    var otherId = req.body.otherId;

    if (!otherId) {
        return res.status(400).send({ error: true, message: 'Please provide other user id' });
    }

    dbConn.query('SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND status=1', [userId, otherId], function (getError, getResults, getFields) {
        if (getError) return res.status(400).send({ error: true, detail: getError.code, message: getError.sqlMessage });
        if (getResults.length)
            return res.status(400).send({ error: true, data: getResults, message: 'Match data is already taken.' });

        var newMatchSql = {
            main_user_id: userId,
            other_user_id: otherId,
            status: 1,
            status_description: 'heart_sent',
            publish: 1,
            created_date: new Date(),
            updated_date: new Date()
        };

        dbConn.beginTransaction(function (err) {
            if (err) return res.status(400).send({ error: true, detail: err.code, message: err.sqlMessage });
            dbConn.query("INSERT INTO tbl_match SET ? ", newMatchSql, function (error, results, fields) {
                if (error) {
                    dbConn.rollback(function () {
                        return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                    });
                }

                var heartReceiveData = {
                    main_user_id: otherId,
                    other_user_id: userId,
                    status: 2,
                    status_description: 'heart_received',
                    mutual_match_id: results.insertId,
                    publish: 1,
                    created_date: new Date(),
                    updated_date: new Date()
                }

                dbConn.query('INSERT INTO tbl_match SET ? ', heartReceiveData, function (error1, receiveResult, fields) {
                    if (error1) {
                        dbConn.rollback(function () {
                            return res.status(400).send({ error: true, detail: error1.code, message: error1.sqlMessage });
                        });
                    }
                    dbConn.query("UPDATE tbl_match SET mutual_match_id=? WHERE id=?", [receiveResult.insertId, results.insertId], function (error, results, fields) {
                        if (error) {
                            dbConn.rollback(function () {
                                return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                            });
                        }

                        dbConn.commit(function (error) {
                            if (error) {
                                dbConn.rollback(function () {
                                    return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                                });
                            };
                            dbConn.query("SELECT * FROM tbl_user WHERE id=?", otherId, function(error1, receiverData, receiverFields) {
                                if (error1) return res.status(403).send({error: true, detail: error1.code, message: error1.sqlMessage});
                                if (!receiverData.length) return res.status(400).send({error: true, message: 'user not found'});
                                const receiver = receiverData[0];
                                const deviceId = receiver.device_id;
                                dbConn.query('SELECT * FROM tbl_user WHERE id=?', userId, function(error2, senderData, senderFeidls) {
                                    if (error2) return res.status(403).send({error: true, detail: error2.code, message: error2.sqlMessage});
                                    if (!senderData.length) return res.status(403).send({error: true, message: 'Sender User not found'});
                                    const sender = senderData[0];
                                    const senderName = sender.name;
                                    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                                        to: deviceId,
                                        notification: {
                                            title: 'Incoming Heart',
                                            body: senderName.toString() + ' sent you a heart.',
                                        },
                                        data: {  //you can send only notification or only data(or include both)
                                            type: 'Income'
                                        }
                                    };
                                    fcm.send(message, function(notiErr, notiRes){
                                        if (notiErr) {
                                            console.log("Something has gone wrong!");
                                            return res.send({ error: false, data: { sentDataId: results.insertId, receiveDataId: receiveResult.insertId }, message: 'New match has been created.' });
                                        } else {
                                            console.log("Successfully sent with response: ", notiRes);
                                            return res.send({ error: false, data: { sentDataId: results.insertId, receiveDataId: receiveResult.insertId }, message: 'New match has been created.' });
                                        }
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

//#13 === user not interest action request
matchApi.post('/dislike', checkAuth, function (req, res) {
    var otherId = req.body.otherId;
    var userId = req.userData.userId;

    if (!otherId) {
        return res.status(400).send({ error: true, message: 'Please provide other user id' });
    }

    dbConn.query("SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND status=3", [userId, otherId], function (error, oldResults, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

        if (oldResults.length)
            return res.status(403).send({ error: true, data: oldResults, message: 'Match data is already Taken.' });

        var notInterestData = {
            main_user_id: userId,
            other_user_id: otherId,
            status: 3,
            status_description: "not_interest",
            publish: 1,
            created_date: new Date(),
            updated_date: new Date()
        };

        dbConn.query("INSERT INTO tbl_match SET ? ", notInterestData, function (error, results, fields) {
            if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

            return res.send({ error: false, data: results, message: 'Dislike data is created.' });
        });
    });
});

var blockFunction = (req, res, next) => {
    try {
        var userId = req.userData.userId;
        var otherId = req.body.otherId;

        if (!otherId) {
            return res.status(400).send({ error: true, message: 'Please provide other user id' });
        }

        dbConn.query("SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND status=8", [userId, otherId], function (error, results, fields) {
            if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
            if (results.length) {
                req.oldData = results[0];
                next();
            } else {
                //get status 2,6,7 match data,
                dbConn.query("SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND publish=1 AND status in (2,6,7)", [userId, otherId], function (error, results, fields) {
                    if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

                    if (results.length) {
                        var resultIdArr = results.map(one => {
                            return one.id;
                        });
                        dbConn.query("UPDATE tbl_match SET publish=0 WHERE id IN (?)", resultIdArr.join(), function (error, updateResults, updateFields) {
                            if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                        });
                    }

                    var blockCreateData = {
                        main_user_id: userId,
                        other_user_id: otherId,
                        status: 8,
                        status_description: "block_created",
                        publish: 1,
                        created_date: new Date(),
                        updated_date: new Date()
                    };

                    dbConn.beginTransaction(function (err) {
                        if (err) return res.status(400).send({ error: true, message: err });
                        dbConn.query("INSERT INTO tbl_match SET ? ", blockCreateData, function (error, results, fields) {
                            if (error) {
                                dbConn.rollback(function () {
                                    return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                                });
                            }

                            req.matchId = results.insertId;

                            var blockRecieveData = {
                                main_user_id: otherId,
                                other_user_id: userId,
                                status: 9,
                                status_description: "block_received",
                                publish: 1,
                                created_date: new Date(),
                                updated_date: new Date()
                            };

                            dbConn.query('INSERT INTO tbl_match SET ? ', blockRecieveData, function (error1, receiveResult, fields) {
                                if (error1) {
                                    dbConn.rollback(function () {
                                        return res.status(400).send({ error: true, detail: error1.code, message: error1.sqlMessage });
                                    });
                                }

                                dbConn.commit(function (error) {
                                    if (error) {
                                        dbConn.rollback(function () {
                                            return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                                        });
                                    };
                                    next();
                                });
                            });
                        });
                    });
                });
            }
        });
    } catch (error) {
        return res.status(401).json({
            message: error
        });
    }
}

//#14 uc4.3 === user set other user with block
matchApi.post('/block', checkAuth, blockFunction, function (req, res) {
    if (req.oldData) return res.send({ error: true, data: req.oldData, message: 'Block Data Already exist' });
    return res.send({ error: false, message: 'New block has been created.' });
});

//#16 uc7.1 display incoming hearts
matchApi.get('/getReceivedHearts', checkAuth, function (req, res) {
    var userId = req.userData.userId;

    var distanceQuery = ' (3959 * acos(cos(radians(d.lat_geo)) * cos(radians(c.lat_geo)) * cos(radians(c.long_geo) - radians(d.long_geo)) + sin(radians(d.lat_geo)) * sin(radians(c.lat_geo)))) as distance, ';

    var ageQuery = ' TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) AS age ';

    var joinQuery = ' inner join tbl_video b on a.other_user_id=b.user_id Inner join tbl_user c on a.other_user_id=c.id inner join tbl_user d on a.main_user_id=d.id ';

    var whereCondition = ' a.publish=1 and a.status=2 and a.main_user_id=? and b.publish=1 and b.is_primary=1 and b.is_reply=0 and c.account_status=1 and c.email_status=1 order by a.id desc ';

    var query = 'SELECT a.id, a.other_user_id, b.cdn_filtered_id, c.name, c.gender, ' + distanceQuery + ageQuery + 'FROM `tbl_match` a ' + joinQuery + 'WHERE' + whereCondition;

    dbConn.query(query, [userId], function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        if (!results.length) return res.status(403).send({ error: true, message: 'Received Heart data not found.' })
        return res.send({ error: false, data: results, message: 'All hearts list' });
    });
});

//#17 uc7.2 ===  incoming hearts : main user rejects heart from other user
matchApi.post('/sendHeartReject', checkAuth, function (req, res) {
    var userId = req.userData.userId;
    var otherUserId = req.body.otherId;

    if (!otherUserId) {
        return res.status(400).send({ error: true, message: 'Please provide other user id' });
    }

    dbConn.query('SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND status=4', [userId, otherUserId], function (getError, oldResults, fields) {
        if (getError) return res.status(400).send({ error: true, detail: getError.code, message: getError.sqlMessage });

        if (oldResults.length)
            return res.status(400).send({ error: true, detail: oldResults, message: 'Already Taken.' });

        var sendRejectData = {
            main_user_id: userId,
            other_user_id: otherUserId,
            status: 4,
            status_description: 'incoming_heart_rejected',
            publish: 1,
            created_date: new Date(),
            updated_date: new Date()
        };

        dbConn.beginTransaction(function (err) {
            if (err) return res.status(400).send({ error: true, detail: err.code, message: err.sqlMessage });
            dbConn.query('INSERT INTO tbl_match set ? ', [sendRejectData], function (error, sendResult, fields) {
                if (error) {
                    dbConn.rollback(function () {
                        return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                    });
                }
                var receiveRejectData = {
                    main_user_id: otherUserId,
                    other_user_id: userId,
                    status: 5,
                    status_description: 'sent_heart_rejected',
                    mutual_match_id: sendResult.insertId,
                    publish: 1,
                    created_date: new Date(),
                    updated_date: new Date()
                }
                dbConn.query('INSERT INTO tbl_match set ? ', [receiveRejectData], function (error, receiveResult) {
                    if (error) {
                        dbConn.rollback(function () {
                            return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                        });
                    };
                    dbConn.query("UPDATE tbl_match SET mutual_match_id = ? WHERE main_user_id = ?", [receiveResult.insertId, userId], function (error, results, fields) {
                        if (error) {
                            dbConn.rollback(function () {
                                return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                            });
                        };
                        dbConn.query('UPDATE tbl_match SET publish=0 WHERE status=2 AND main_user_id=? AND other_user_id=?', [userId, otherUserId], function (error2, updateResult, fields) {
                            if (error2) {
                                dbConn.rollback(function () {
                                    return res.status(400).send({ error: true, detail: error2.code, message: error2.sqlMessage });
                                });
                            }
                            dbConn.commit(function (error) {
                                if (error) {
                                    dbConn.rollback(function () {
                                        return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                                    });
                                };
                                return res.send({ error: false, message: 'Rejected.' });
                            });
                        });
                    });
                });
            });
        });
    });
});

//#22 uc 7.3 Incoming Hearts: main user accpets heart from other user
matchApi.post('/requestMatch', checkAuth, function (req, res) {
    var userId = req.userData.userId;
    var otherUserId = req.body.otherId;

    if (!otherUserId) {
        return res.status(400).send({ error: true, message: 'Please provide other user id' });
    }

    dbConn.query('SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND publish=1 AND status=6', [userId, otherUserId], function (error, oldMatchResult, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

        if (oldMatchResult.length)
            return res.status(400).send({ error: true, message: 'Match data already exist.' });

        var heartSendData = {
            main_user_id: userId,
            other_user_id: otherUserId,
            status: 6,
            publish: 1,
            status_description: 'incoming_heart_accepted',
            created_date: new Date(),
            updated_date: new Date()
        };

        dbConn.beginTransaction(function (err) {
            if (err) return res.status(400).send({ error: true, message: err });
            dbConn.query('INSERT INTO tbl_match set ? ', [heartSendData], function (error, sendResult) {
                if (error) {
                    dbConn.rollback(function () {
                        return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                    });
                };
                var heartAccpetData = {
                    main_user_id: otherUserId,
                    other_user_id: userId,
                    status: 7,
                    publish: 1,
                    mutual_match_id: sendResult.insertId,
                    status_description: 'sent_heart_accepted',
                    created_date: new Date(),
                    updated_date: new Date()
                }
                dbConn.query('INSERT INTO tbl_match set ? ', [heartAccpetData], function (error, receiveResult) {
                    if (error) {
                        dbConn.rollback(function () {
                            return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                        });
                    };

                    dbConn.query("UPDATE tbl_match SET mutual_match_id=? WHERE id=?", [receiveResult.insertId, sendResult.insertId], function (error, results, fields) {
                        if (error) {
                            dbConn.rollback(function () {
                                return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                            });
                        };
                        dbConn.query('UPDATE tbl_match SET publish=0 WHERE status=2 AND main_user_id=? AND other_user_id=?', [userId, otherUserId], function (error, results, fields) {
                            if (error) {
                                dbConn.rollback(function () {
                                    return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                                });
                            }

                            dbConn.query('SELECT cdn_id FROM tbl_video WHERE user_id=? AND is_primary=1 AND is_reply=0', otherUserId, function (error, cdnResults, fields) {
                                if (error) {
                                    dbConn.rollback(function () {
                                        return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                                    });
                                }
                                if (!cdnResults.length) return res.send({ error: true, message: "user's private video does not exist." });
                                dbConn.commit(function (error) {
                                    if (error) {
                                        dbConn.rollback(function () {
                                            return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                                        });
                                    };
                                    dbConn.query("SELECT * FROM tbl_user WHERE id=?", otherUserId, function(error1, receiverData, receiverFields) {
                                        if (error1) return res.status(403).send({error: true, detail: error1.code, message: error1.sqlMessage});
                                        if (!receiverData.length) return res.status(400).send({error: true, message: 'user not found'});
                                        const receiver = receiverData[0];
                                        const deviceId = receiver.device_id;
                                        dbConn.query('SELECT * FROM tbl_user WHERE id=?', userId, function(error2, senderData, senderFeidls) {
                                            if (error2) return res.status(403).send({error: true, detail: error2.code, message: error2.sqlMessage});
                                            if (!senderData.length) return res.status(403).send({error: true, message: 'Sender User not found'});
                                            const sender = senderData[0];
                                            const senderName = sender.name;
                                            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                                                to: deviceId,
                                                notification: {
                                                    title: 'You have a new match!',
                                                    body: senderName.toString() + ' is matched with you.',
                                                },
                                                data: {  //you can send only notification or only data(or include both)
                                                    type: 'Match'
                                                }
                                            };
                                            fcm.send(message, function(notiErr, notiRes){
                                                if (notiErr) {
                                                    console.log("Something has gone wrong!");
                                                    return res.send({ error: false, data: { cdn_id: cdnResults[0].cdn_id, match_id: receiveResult.insertId }, message: "New match is created." });
                                                } else {
                                                    console.log("Successfully sent with response: ", notiRes);
                                                    return res.send({ error: false, data: { cdn_id: cdnResults[0].cdn_id, match_id: receiveResult.insertId }, message: "New match is created." });
                                                }
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
    });
});

//#23 uc 8 Matched Page Display Matched list(matched_id)
matchApi.get('/matches', checkAuth, function (req, res) {
    var userId = req.userData.userId;

    if (!userId) {
        return res.status(400).send({ error: true, message: 'Please login again!' });
    }

    var distanceQuery = '(3959 * acos (cos (radians(d.lat_geo)) * cos(radians( b.lat_geo )) * cos(radians( b.long_geo ) - radians(d.long_geo)) + sin ( radians( d.lat_geo) )  * sin( radians( b.lat_geo ) ))) as distance, ';
    var ageQuery = 'TIMESTAMPDIFF(YEAR, b.birth_date, CURDATE()) AS age ';
    var joinQuery = ' inner join tbl_user b on a.other_user_id=b.id inner join tbl_video c on a.other_user_id=c.user_id inner join tbl_user d on a.main_user_id=d.id';
    var whereCondition = ' where a.main_user_id=? and a.status in (6,7) and a.publish=1 and b.account_status=1 and b.email_status=1 and c.is_primary=1 and c.is_reply=0 and c.publish=1 ';
    dbConn.query('SELECT a.id, a.main_user_id, a.other_user_id, b.name, b.gender, b.language_id, b.country_id, b.ethnicity_id, c.cdn_id, ' + distanceQuery + ageQuery + ' FROM tbl_match a ' + joinQuery + whereCondition + ' order by a.id desc', [userId], function (error, results, fields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        return res.send({ error: false, data: results, message: 'All match data' });
    });
});

// UC4.1 - Browse : display one user
matchApi.post('/discover', checkAuth, function (req, res) {
    var userId = req.userData.userId;

    dbConn.query("SELECT lat_geo, long_geo FROM tbl_user WHERE id=?", userId, function (error, loggedUserResults, loggedUserFields) {
        if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
        if (!loggedUserResults.length) return res.status(403).send({ error: true, message: 'User does not exist' });
        var myData = loggedUserResults[0];

        var myLat = myData.lat_geo;
        if (myLat == null) return res.send({ error: false, message: 'User location information is invalid.' });
        var myLong = myData.long_geo;
        if (myLong == null) return res.send({ error: false, message: 'User location information is invalid.' });

        //age, gender, ethnicity, country, distance, language
        var distance = 0;
        var selectQuery = 'a.id, a.birth_date, a.name, a.gender, TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) AS age, a.last_loggedin_date, e.cdn_filtered_id, b.ethnicity_name, c.country_name, d.language_name, ';

        var getOtherMatchInfo = 'select other_user_id from tbl_match where main_user_id=? and status != 0';

        var joinQuery = ' INNER JOIN tbl_ethnicity AS b ON a.ethnicity_id=b.id INNER JOIN tbl_country AS c ON a.country_id=c.id INNER JOIN tbl_language AS d ON a.language_id=d.id';

        joinQuery += ' INNER JOIN tbl_video as e ON a.id=e.user_id';

        var distanceQuery = '(3959 * acos (cos(radians(' + myLat + ') ) * cos(radians( a.lat_geo)) * cos(radians(a.long_geo) - radians(' + myLong + ')) + sin (radians(' + myLat + ') ) * sin( radians(a.lat_geo))))';
        var whereCondition = ' a.account_status=1 AND a.id NOT IN (' + getOtherMatchInfo + ') AND a.id!=? AND e.match_id is null AND e.is_primary=1 AND e.is_reply=0';
        if (req.body.distance) {
            distance = req.body.distance;
            whereCondition += ' AND (' + distanceQuery + ') <' + distance;
        }
        if (req.body.gender) {
            var gender = req.body.gender;
            whereCondition += ' AND a.gender=' + gender;
        }
        if (req.body.ethnicityId) {
            whereCondition += ' AND a.ethnicity_id=' + req.body.ethnicityId;
        }
        if (req.body.countryId) {
            whereCondition += ' AND a.country_id=' + req.body.countryId;
        }
        if (req.body.languageId) {
            whereCondition += ' AND a.language_id=' + req.body.languageId;
        }
        if (req.body.lessAge) {
            whereCondition += ' AND TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) < ' + req.body.lessAge;
        }
        if (req.body.greaterAge) {
            whereCondition += ' AND TIMESTAMPDIFF(YEAR, a.birth_date, CURDATE()) > ' + req.body.greaterAge;
        }

        var query = 'SELECT ' + selectQuery + distanceQuery + ' as distance FROM tbl_user as a' + joinQuery + ' WHERE ' + whereCondition + ' ORDER BY a.last_loggedin_date asc limit 1';

        dbConn.query(query, [userId, userId], function (error, results, fields) {
            if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
            if (!results.length)
                return res.send({ error: false, message: 'Not found.' });
            var otherUser = results[0];
            var otherUserId = otherUser.id;
            dbConn.query('SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND status=0', [userId, otherUserId], function (error, results, fields) {
                if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });

                var newMatchData = {
                    main_user_id: userId,
                    other_user_id: otherUser.id,
                    status: 0,
                    status_description: 'viewed',
                    publish: 1,
                    created_date: new Date(),
                    updated_date: new Date()
                };
                if (otherUser.last_loggedin_date) {
                    otherUser.last_activity = commonFunc.timeAgo(otherUser.last_loggedin_date);
                }
                if (results.length) return res.status(403).send({ error: false, data: otherUser, message: 'A New Lovely User found.' });
                dbConn.query('INSERT INTO tbl_match SET ? ', [newMatchData], function (error, newMatch, fields) {
                    if (error) return res.status(400).send({ error: true, detail: error.code, message: error.sqlMessage });
                    otherUser.match_id = newMatch.insertId;
                    return res.send({ error: false, data: otherUser, message: "A New Lovely User found." });
                });
            });
        });
    });
});


module.exports.matchApi = matchApi;
module.exports.blockFunction = blockFunction;

