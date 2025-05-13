module.exports = function (req, res, next) {
  // Assumes authMiddleware has already run and populated req.user
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin role required.' });
  }
  next(); // User is an admin, proceed to the next middleware or route handler
}; 