const express = require("express");
const storageApi = express.Router();
const dbConn = require("../config/dbConfig");
const checkAuth = require('../middleware/check_auth');
const { bucket, sideBucket } = require('../config/storageConfig');
const uuidv1 = require('uuid/v1');
const moment = require('moment');

storageApi.get('/videoLink', checkAuth, (req, res) => {
  const fileId = req.query.fileId;

  // TODO: SQL query to see if user has right to view video here

  sideBucket.getFiles(function(err, files) {
    if (err) {
      res.status(500).send('Storage API could not get files.');
    } else {
      const match = files.find(file => file.id === fileId);

      if (match) {
        match.getSignedUrl({
          action: 'read',
          expires: '03-17-2025'
        }, (err, url) => {
          if (err) {
            res.status(500).send('Storage API could not get signed URL.');
          } else {
            res.send({ url });
          }
        });
      } else {
        res.status(400).send('Video not found.');
      }
    }
  });
});

storageApi.get('/uploadCredentials', checkAuth, (req, res) => {
  const isPrimary = Number(req.query.isPrimary || 0);
  const userId = req.userData.userId;
  const fileId = `${userId}_${isPrimary ? 1 : 0}_${uuidv1()}`;
  const file = bucket.file(fileId);
  const options = {
    equals: ['$Content-Type', 'video/mp4'],
    expires: moment().add(1, 'weeks').format('MM-DD-YYYY'),
    contentLengthRange: {
      min: 0,
      // 100MB
      max: 1024 * 1000 * 100,
    },
    // successStatus: 'succ',
  };

  file.getSignedPolicy(options, function(err, policy) {
    if (err) {
      res.status(500).send('Storage API could not get signed policy.');
    } else {
      console.log('Sending policy:', policy);
      res.send({
        policy,
        fileId,
      });
    }
  });
});

module.exports = storageApi;