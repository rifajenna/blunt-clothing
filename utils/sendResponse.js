export const sendResponse = (res, { code, message, redirectUrl, data }) => {
  return res.status(code).json({
    success: code >= 200 && code < 300,
    message,
    ...(redirectUrl && { redirectUrl }),
    ...(data && { data }),
  });
};
