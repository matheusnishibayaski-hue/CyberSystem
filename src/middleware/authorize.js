const authorize = (roles = []) => (req, res, next) => {
  const userRole = req.user && req.user.role;

  if (!userRole || !roles.includes(userRole)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

module.exports = { authorize };
