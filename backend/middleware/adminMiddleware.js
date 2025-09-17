const { AuthorizationError } = require('../utils/errorHandler');

module.exports = function (req, res, next) {
  // Assumes authMiddleware has already run and populated req.user
  if (!req.user || req.user.role !== 'admin') {
    throw new AuthorizationError('Access denied. Admin role required.');
  }
  next(); // User is an admin, proceed to the next middleware or route handler
}; 