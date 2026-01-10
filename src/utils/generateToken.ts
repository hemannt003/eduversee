import jwt from 'jsonwebtoken';

const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, getJWTSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};
