const env = require('../config/env');

// Tiny request log. Private tokens inside URLs are hidden so they never reach log files.
const redact = (url) =>
  url.split('?')[0].replace(/(\/public\/(?:menu|orders)\/)[^/]+/, '$1[token]');

module.exports = (req, res, next) => {
  if (env.isTest) return next();
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `${req.method} ${redact(req.originalUrl)} ${res.statusCode} ${Date.now() - start}ms`,
    );
  });
  next();
};
