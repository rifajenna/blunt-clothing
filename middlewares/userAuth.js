export const isUserLoggedIn = (req, res, next) => {

  res.set("Cache-Control", "no-store");

  if (!req.session.user) {
    return res.redirect("/user/login");
  }

  next();
};

