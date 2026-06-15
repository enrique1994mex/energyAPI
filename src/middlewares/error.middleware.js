import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import logger from '../config/logger.js';

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.issues[0].message });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Resource not found' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  logger.error({
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  }, "unhandled error");
  res.status(500).json({ message: 'Internal Server Error' });
};

export default errorMiddleware;