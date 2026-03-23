export const getDashboard = (req, res) => {
  res.render("admin/pages/dashboard", {
    title: "Dashboard",
    showLayout: true,
    cssFile: "dashboard.css",
    pageJS: "",
  });
};
