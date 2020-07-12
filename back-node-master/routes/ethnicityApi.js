var express = require("express");
var ethnictiyApi = express.Router();
var dbConn = require("../config/dbConfig");
const checkAuth = require('../middleware/check_auth');

//#20 uc 5.1 get ethnicity
ethnictiyApi.get('/all', function(req, res) {
    var publish = 1;
    dbConn.query('SELECT * FROM tbl_ethnicity where publish=?', publish, function (error, results, fields) {
        console.log(error);
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});        
        return res.send({ error: false, data: results, message: "Country list"});
    });
});


module.exports = ethnictiyApi;

