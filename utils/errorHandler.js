export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
 
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
 
  // If it's an API/AJAX request, send JSON
  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
 
  // Otherwise render an error page or redirect
  res.status(statusCode).send(`<h1>${statusCode} - ${message}</h1>`);
};