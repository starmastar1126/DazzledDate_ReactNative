var express = require("express");
var countryApi = express.Router();
var dbConn = require("../config/dbConfig");
const checkAuth = require('../middleware/check_auth');

//#19 uc 5.1 get country
countryApi.get('/all', function(req, res) {
    var publish = 1;
    dbConn.query('SELECT * FROM tbl_country where publish=?', publish, function (error, results, fields) {
        if (error) return res.status(400).send({error: true, detail: error.code, message: error.sqlMessage});
        
        return res.send({ error: false, data: results, message: "Country list"});
    });
});


module.exports = countryApi;

