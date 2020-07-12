module.exports = (req, res, next) => {
    try {
      if (req.headers.authorization !== 'test') {
        throw new Error('cloud function not authorized');
      } else {
        next();
      }
    } catch (error) {
        return res.status(401).json({
            message: 'Auth Failed'
        });
    }
}