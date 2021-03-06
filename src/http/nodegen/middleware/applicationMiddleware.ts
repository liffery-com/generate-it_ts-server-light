// http/nodegen/middleware/applicationMiddleware.ts
import {
  corsMiddleware,
  inferResponseType,
} from '@/http/nodegen/middleware';
import express from 'express';
import morgan from 'morgan';
import requestIp from 'request-ip';
import packageJson from '../../../../package.json';

export const responseHeaders = (app: express.Application): void => {
  app.use(corsMiddleware());
};

export const requestParser = (app: express.Application): void => {
  app.use(express.json({ limit: '50mb' }));

  // parse the body
  app.use(express.urlencoded({ extended: false }));

  app.use(requestIp.mw());
};

export const accessLogger = (app: express.Application): void => {
  // A bug in the morgan logger results in IPs being dropped when the node instance is running behind a proxy.
  // The following pattern uses the requestIp middleware "req.client" and adds the response time.
  // `[${packageJson.name}] :remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]`
  app.use(morgan(function (tokens, req, res) {
    return [
      '[' + packageJson.name + ']',
      req.clientIp,
      '[' + new Date().toISOString() + ']',
      '"' + tokens.method(req, res),
      tokens.url(req, res),
      'HTTP/' + tokens['http-version'](req, res) + '"',
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'),
      '-',
      tokens['response-time'](req, res),
      'ms'
    ].join(' ');
  }));
};

/**
 * Injects routes into the passed express app
 * @param app
 */
export const requestMiddleware = (app: express.Application): void => {
  accessLogger(app);
  requestParser(app);
  responseHeaders(app);
  app.use(inferResponseType());
};

