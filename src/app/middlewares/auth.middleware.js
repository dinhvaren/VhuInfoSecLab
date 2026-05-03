const jwt = require("jsonwebtoken");

function loadUser(req, res, next) {
  const token = req.cookies?.auth_token;

  res.locals.user = null;
  res.locals.currentPath = req.originalUrl.split("?")[0];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    res.locals.user = decoded;

    if (!req.session.user) {
      req.session.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        team: decoded.team || null,
      };
    }
  } catch (err) {
    res.clearCookie("auth_token");
    req.user = null;
    res.locals.user = null;
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.user && !req.session?.user) {
    return res.redirect("/auth/login");
  }

  next();
}

function requireAdmin(req, res, next) {
  const user = req.user || req.session?.user;

  if (!user) {
    return res.redirect("/auth/login");
  }

  if (user.role !== "admin") {
    return res.status(403).render("error/403", {
      title: "Forbidden",
      message: "You do not have permission to access this page.",
    });
  }

  next();
}

module.exports = {
  loadUser,
  requireAuth,
  requireAdmin,
};