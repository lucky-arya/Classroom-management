/**
 * Security middleware (rate limiting, bot detection, shield).
 * 
 * This middleware is currently DISABLED. To enable:
 * 1. Install @arcjet/node: npm install @arcjet/node
 * 2. Set ARCJET_KEY in your .env file
 * 3. Restore the full implementation below
 * 4. Uncomment `app.use(securityMiddleware)` in src/index.ts
 */

import type { NextFunction, Request, Response } from "express";

const securityMiddleware = async (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Security middleware is disabled. Uncomment and configure Arcjet to enable.
  return next();
};

export default securityMiddleware;