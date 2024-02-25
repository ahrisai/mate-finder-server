import { secretKey } from '../config.js';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../queryTypes.js';

export default function (req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS' || req.path === '/api/login' || req.path === '/api/registration') {
    return next();
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      console.log('token sdox');
      return res.status(403).json({ message: 'user not authorized' });
    }

    const decoded = jwt.verify(token, secretKey);

    req.user = decoded as JwtUser;
    if (req.path === 'api/check') {
      return res.status(202).json({ message: 'true' });
    }

    next();
  } catch (e) {
    return res.status(403).json({ message: 'user not authorized' });
  }
}
