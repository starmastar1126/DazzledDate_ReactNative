var express = require("express");
var languageApi = express.Router();
var dbConn = require("../config/dbConfig");
const checkAuth = require('../middleware/check_auth');

//#21 uc 5.1 get languages
languageApi.get('/all', function(req, res) {
    var publish = 1;
    dbConn.query('SELECT * FROM tbl_language where publish=?', publish, function (error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        
        return res.send({ error: false, data: results, message: "Language list"});
    });
});

module.exports = languageApi;

