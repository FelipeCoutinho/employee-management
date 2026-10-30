import cors from 'cors';
import express from 'express';
import { environment } from './config/environment.js';
import { employeeRouter } from './domains/employee/employee.routes.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { notFoundHandler } from './shared/middlewares/notFoundHandler.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || requestOrigin === environment.corsOrigin) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }));
  app.use(express.json({ strict: true }));
  app.use('/api/employees', employeeRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
