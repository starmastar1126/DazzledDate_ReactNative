var express = require("express");
var videoApi = express.Router();
var dbConn = require("../config/dbConfig");
const checkAuth = require('../middleware/check_auth');
const checkAuthCloudFunction = require('../middleware/check_auth_cloud_function');

// #8 === insert new video after upload to firebase storage
videoApi.post('/new', checkAuthCloudFunction, function(req,res,next) {
    let cdn_id = req.body.cdn_id;
    let userId = req.body.userId;
  
    if (!cdn_id) {
        return res.status(400).send({ error:true, message: 'Please provide video id'});
    }

    if (!userId) {
        return res.status(400).send({ error:true, message: 'Please provide video id'});
    }

	dbConn.query('SELECT * FROM tbl_video where user_id=?', userId, function (error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
		
        var newVideoSql = {
            user_id: userId,
            cdn_id: cdn_id,
            created_date: new Date(),
            updated_date: new Date(),
            is_reply: 0,
            is_primary: 1,
            publish: 1,
            match_id: null             
        };
        dbConn.query("INSERT INTO tbl_video SET ? ", newVideoSql, function (error, results, fields) {
            if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
            //update this row with filtered cdn id
            return res.send({ error: false, data: results, message: "User's video has been created succssfully."});               
        });
    });
});

//video update after uploaded
videoApi.put('/update/:cdn_id', checkAuthCloudFunction, function(req, res) {
    var userId = req.body.userId;
    var cdnId = req.params.cdn_id;

    if (!cdnId)
        return res.status(400).send({error: true, message: 'Please provide video id'});

    var cdnFilteredId = req.body.cdn_filtered_id;
    if (!cdnFilteredId) 
        return res.status(400).send({error: true, message: 'Please provide video filtered Id'});
    
    dbConn.query('SELECT * FROM tbl_video WHERE user_id=? AND cdn_id=?', [userId, cdnId], function(error1, cdnResult, fields) {
        if (error1) return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});
        if (!cdnResult.length) return res.send({error: false, message: 'Video Not Found.'});
        var videoId = cdnResult[0].id;
        var updateData = {
            cdn_filtered_id: cdnFilteredId,
            updated_date: new Date()
        };
        dbConn.beginTransaction(function(err){
            if (err) return res.status(400).send({error: true, message: err});
            dbConn.query('UPDATE tbl_video SET ? WHERE id=?', [updateData, videoId], function(error2, updateResult, fields) {
                if (error2) {
                    dbConn.rollback(function(){
                        return res.status(400).send({error: true, detail: error2.code, message: error2.sqlMessage});
                    });
                }
                dbConn.query("SELECT * FROM tbl_video WHERE id=?", videoId, function (error3, filteredResult, fields) {
                    if (error3) {
                        dbConn.rollback(function() {
                            return res.status(400).send({error: true, detail: error3.code, message: error3.sqlMessage});
                        });
                    };
                    dbConn.commit(function(error4) {
                        if (error4) {
                            dbConn.rollback(function() {
                                return res.status(400).send({error: true, detail: error4.code, message: error4.sqlMessage});
                            });
                        };
                        return res.send({ error: false, data: filteredResult, message: "User's Video was updated."});
                    });
                });  
            });             
        });
    });
});

//#9 === upload reply video
videoApi.post('/reply', checkAuth, function(req, res) {
    let userId = req.userData.userId;
    dbConn.query('SELECT id FROM tbl_match where other_user_id=? AND status=1 AND status_description="heart_sent"', userId, function (error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        
        if (!results.length)
            return res.status(400).send({ error:true, message: 'Match data cannot be found.'});
        var newVideoSql = {
            user_id: userId,
            created_date: new Date(),
            is_reply: 1,
            is_primary: 0,
            match_id: results[0]
        };
    
        dbConn.query("INSERT INTO tbl_video SET ? ", newVideoSql, function (error, results, fields) {
            if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
            return res.send({ error: false, data: results, message: "User's reply video has been created succssfully."});
        });
    });
});

//#10 uc 6 other videos for the users
videoApi.get('/othervideo/:otherId', checkAuth, function(req, res) {
    var userId = req.userData.userId;
    var otherId = req.params.otherId;

    if (!otherId)
        return res.status(400).send({error: true, message: "Please provide other`s Id"});

    dbConn.query("SELECT * FROM tbl_match WHERE main_user_id=? AND other_user_id=? AND status IN (6,7) AND publish=1", [userId, otherId], function(error, matchResult, matchFields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        var searchFields;
        if (matchResult.length) {
            searchFields = 'cdn_id';
        } else {
            searchFields = 'cdn_filtered_id';
        }
        dbConn.query('SELECT '+searchFields+' from tbl_video where user_id= ? and is_reply=0 and publish=1 order by created_date desc', [otherId], function (error, results, fields){
            if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
            return res.send({ error: false, data: results, message: "list other videos for the user"});
        });
    });
});

//#25 uc 8.1 matched page return for video ids === UC A
videoApi.get('/getVideosByMatchId/:matchId', checkAuth, function(req, res) {
    var userId = req.userData.userId;
    var matchId = req.params.matchId;

    dbConn.query('SELECT * FROM tbl_match WHERE id=? AND main_user_id=? OR other_user_id=?', [matchId, userId, userId], function(error, getResults, getFields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        if (!getResults.length) return res.status(403).send({error: true, message: 'Match Data Not Found.'});
        
        dbConn.query('SELECT a.cdn_id, a.created_date, b.name, b.email_address, b.birth_date, b.gender FROM tbl_video a INNER JOIN tbl_user b ON a.user_id=b.id WHERE a.match_id=? AND a.is_reply=1 AND a.is_primary=1 AND a.publish=1', matchId, function(error1, videoResults, videoFields) {
            if (error1) return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});
            if (!videoResults.length) return res.send({error: true, message: 'Video Data Not Found'});

            return res.send({error: false, data: videoResults, message: 'Matched Video Data'});
        });
    });
});

//#26 uc 8.1 === UC B
videoApi.get('/getMatchedMyVideo', checkAuth, function(req, res) {
    var userId = req.userData.userId;

    var whereCondition = 'user_id=? and is_primary=1 and is_reply=0 and publish=1 limit 1';
    dbConn.query('Select cdn_id from tbl_video where ' + whereCondition, [userId], function(error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        return res.send({ error: false, data: results, message: "Matched my video Id"});
    });
});

//#27 uc 8.1 === UC C
videoApi.post('/getVideoForOther', checkAuth, function(req, res) {
    var userId = req.userData.userId;
    var otherId = req.body.otherId;
    
    var getMatchQuery = 'select id from tbl_match where main_user_id=? and other_user_id=? and status=1 and publish=1 limit 1';
    var whereCondition = ' a.user_id=? And a.is_reply=1 and a.is_primary=0 and a.publish=1 And a.match_id=('+getMatchQuery+')';
    dbConn.query('Select a.cdn_id from tbl_video a inner join tbl_match b On a.match_id=b.id Where ' + whereCondition, [userId, userId, otherId], function(error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        return res.send({ error: false, data: results, message: "Get video for Other"});
    });
});

//#28 uc8.1 === UC D
videoApi.post('/getVideoForMe', checkAuth, function(req, res) {
    var userId = req.userData.userId;
    var otherId = req.body.otherId;
    
    var whereCondition = 'user_id=? and is_primary=1 and is_reply=0 and publish=1 limit 1';
    dbConn.query('Select cdn_id from tbl_video where ' + whereCondition, [otherId], function(error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        return res.send({ error: false, data: results, message: "Get video for Me"});
    })
});

//#34 UC12.1 - My Video Page - display my videos
videoApi.get('/getMyAllVideo', checkAuth, function(req, res) {
    var userId = req.userData.userId;
    dbConn.query('SELECT * FROM tbl_video WHERE publish=? AND is_reply=? AND user_id=?', [1, 0, userId], function(error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        return res.send({error: false, data: results, message: 'user non-reply video list'});
    });
});

//#35 UC 12.2 - My Video Page - set as primary video
videoApi.put('/setAsPrimary/:videoId', checkAuth, function(req, res) {
    var videoId = req.params.videoId;
    var userId = req.userData.userId;
    
    if (!videoId) 
        return res.status(400).send({error: true, message: 'Wrong video id'});
                
    dbConn.query('SELECT * FROM tbl_video WHERE user_id=? AND is_reply=0 AND is_primary=1', userId, function(err, oldResults, fields) {
        if (err) return res.status(400).send({error: true, detail: err.code, message: err.sqlMessage});

        if (!oldResults.length) {
            var updateData = {
                is_primary: 1,
                updated_date: new Date()
            };

            dbConn.query('UPDATE tbl_video SET ? WHERE id=?', [updateData, videoId], function(error, results, fields) {
                if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});

                dbConn.query('SELECT * from tbl_video WHERE id=?', videoId, function(error1, updatedRow, fields) {
                    if (error1) return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});
                    return res.send({error: false, data: updatedRow, message: 'User`s video has been as primary video'});
                });
            });
        } else {
            var oldData = oldResults[0];
            var oldId = oldData.id;
            if (videoId == oldId)
                return res.send({error: false, data: oldData, message: 'This video is already primary video'});
            
            var oldUpdateData = {
                is_primary: 0,
                updated_date: new Date()
            };
    
            dbConn.query("UPDATE tbl_video SET ? WHERE id=?", [oldUpdateData, oldId], function(error, oldUpdate, oldFields) {
                if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
    
                var updateData = {
                    is_primary: 1,
                    updated_date: new Date()
                };
    
                dbConn.query('UPDATE tbl_video SET ? WHERE id=?', [updateData, videoId], function(error, results, fields) {
                    if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
    
                    dbConn.query('SELECT * from tbl_video WHERE id=?', videoId, function(error1, updatedRow, fields) {
                        if (error1) return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});
                        return res.send({error: false, data: updatedRow, message: 'User`s video has been as primary video'});
                    });
                });
            });
        }            
    });
});

// #36 UC12.2 - My Video Page - upload my videos
videoApi.post('/uploadMyVideo', checkAuthCloudFunction, function(req, res) {
    var userId = req.body.userId;
    var cdnId = req.body.cdn_id;
    var cdnFilteredId = req.body.cdn_filtered_id;
    var durationSecond = req.body.duration;

    if (!cdnId || !cdnFilteredId || !durationSecond)
        return res.status(400).send({error: true, message: 'Invalid Params.'});

    var newVideoData = {
        user_id: userId,
        cdn_id: cdnId,
        cdn_filtered_id: cdnFilteredId,
        duration_seconds: durationSecond,
        is_primary: 0,
        is_reply: 0,
        publish: 1,
        created_date: new Date(),
        updated_date: new Date()
    };
    dbConn.query('INSERT INTO tbl_video SET ? ', newVideoData, function(error, newResults) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        return res.send({error: false, data: newResults.insertId, message: 'Video was uploaded successfully.'});  
    });
});

// #37 UC12.3 - My Page - delete my videos
videoApi.put('/removeMyVideo/:videoId', checkAuth, function(req, res) {
    var videoId = req.params.videoId;
    var userId = req.userData.userId;
    
    if (!videoId) {
        return res.status(400).send({error: true, message: 'Please provide video Id'});
    }
        
    dbConn.query('SELECT * FROM tbl_video WHERE id=? AND publish=1', [videoId], function(error1, oldResults) {
        if (error1) 
            return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});

        if (!oldResults.length) 
            return res.send({error: true, message: 'Video Not Found.'});

        var videoData = oldResults[0];
        var primaryStatus = videoData.is_primary;
        if (primaryStatus == 1) {
            dbConn.query('SELECT * FROM tbl_video WHERE user_id=? AND id!=? AND publish=1', [userId, videoId], function(error2, otherResults, otherFields) {
                if (error2) return res.status(400).send({error: true, detail: error2.code, message: error2.sqlMessage});
                if (!otherResults.length) return res.send({error: true, message: 'Remove Failed! This video is primary video. And User doesn`t have any other video. User must have one primary video, at least'});
                var findNextVideos = otherResults.filter(video => video.id > videoId);
                var nextVideo;
                if (findNextVideos.length > 0) {
                    nextVideo = findNextVideos[0];
                } else {
                    nextVideo = otherResults[0];
                }
                var nextVideoId = nextVideo.id;
                var updateData = {
                    is_primary: 1,
                    is_reply: 0,
                    updated_date: new Date()
                };
                dbConn.query('UPDATE tbl_video SET publish=0, is_primary=0 WHERE id=? ', videoId, function(error2, newResult) {
                    if (error2) return res.status(400).send({error: true, detail: error2.code, message: error2.sqlMessage});
                    
                    dbConn.query("UPDATE tbl_video SET ? WHERE id=?", [updateData, nextVideoId], function(error3, newPrimaryResult, newPrimaryFields) {
                        if (error3) return res.status(403).send({error: true, detail: error3.code, message: error3.sqlMessage});
                        
                        dbConn.query('SELECT * FROM tbl_video WHERE id=?', nextVideoId, function(error4, getResult, getFields) {
                            if (error4) return res.status(403).send({error: true, detail: error4.code, message: error4.sqlMessage});
                            return res.send({error: false, data: getResult, message: 'Video was removed successfully. And next video was set into primary video.'});
                        });   
                    });          
                });                
            });
        } else {
            dbConn.query('UPDATE tbl_video SET publish=0, is_primary=0 WHERE id=? ', videoId, function(error2, newResult) {
                if (error2) return res.status(400).send({error: true, detail: error2.code, message: error2.sqlMessage});
                return res.send({error: false, message: 'Video was removed successfully.'});   
            });
        }        
    });
});

videoApi.get('/getVideosByOtherId/:otherId', checkAuth, function(req,res) {
    var otherId = req.params.otherId;
    var userId = req.userData.userId;
    
    dbConn.query('SELECT id FROM tbl_match WHERE status in (6,7) AND main_user_id=? AND other_user_id=?', [userId, otherId], function(error, oldResults, oldFields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        if (!oldResults.length) return res.status(403).send({error: true, message: 'User does not have any accepted match data.'});

        dbConn.query('SELECT a.*, b.name, TIMESTAMPDIFF(YEAR, b.birth_date, CURDATE()) AS age, b.gender FROM tbl_video a INNER JOIN tbl_user b ON a.user_id=b.id WHERE a.user_id=? AND a.publish=1 AND a.is_reply=0', otherId, function(error1, otherResults, otherFields) {
            if (error1) return res.status(400).send({error: true, detail: error1.code, message: error1.sqlMessage});
            return res.send({error: false, data: otherResults, message: 'Selected User`s Video List'});
        });
    });
});

module.exports = videoApi;