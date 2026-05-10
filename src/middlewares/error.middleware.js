import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

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

  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
};

export default errorMiddleware;