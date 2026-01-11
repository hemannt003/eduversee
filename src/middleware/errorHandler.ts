import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors with HTTP status codes
 * Properly extends Error to maintain stack traces and error handling
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const errorHandler = (
  err: Error | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle AppError instances
  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Server Error';

    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle generic Error instances
  if (err instanceof Error) {
    const statusCode = (err as any).statusCode || (err as any).status || 500;
    const message = err.message || 'Server Error';

    return res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle any other error types (validation errors, database errors, etc.)
  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || err?.toString() || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err?.stack,
      error: err 
    }),
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
