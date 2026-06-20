import { AppError } from "../errors/AppError.js";
import logger from "../config/logger.js";

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    logger.warn({
      requestId: req.requestId,
      event: 'access_denied',
      userId: req.user.id,
      role: req.user.role,
      requiredRoles: roles,
      path: req.originalUrl,
    }, 'security');
    return next(new AppError("Forbidden", 403));
  }
  next();
};
