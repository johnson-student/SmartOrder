const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Behind Nginx there is one proxy: needed so rate limiting sees the real visitor IP.
if (env.isProduction) app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl, // only our own frontend may call the API from a browser
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(requestLogger);
app.use(express.json({ limit: '100kb' }));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
