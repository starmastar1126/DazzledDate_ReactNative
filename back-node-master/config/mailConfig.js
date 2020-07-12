const sgMail = require('@sendgrid/mail');
const async = require('async');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/*  sendgrid email sending */

module.exports.sendEmail = function(
    parentCallback,
    fromEmail,
    toEmails,
    subject,
    textContent,
    htmlContent
  ) {
    const errorEmails = [];
    const successfulEmails = [];
    
    async.parallel([
      function(callback) {
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
    ], function(err, results) {
      // console.log('Done');
      if (err) return err; 
      return results;
    });
    parentCallback(null,
      {
        successfulEmails: successfulEmails,
        errorEmails: errorEmails,
      }
    );
}