export const isAdminLoggedIn = (req, res, next) => {

  res.set("Cache-Control", "no-store");

  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }

  next();
};