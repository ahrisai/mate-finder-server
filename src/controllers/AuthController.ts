import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { secretKey } from '../config.js';
import { JwtUser } from '../queryTypes.js';

const generateAccessToken = (id: number, name: string) => {
  const payload = {
    id,
    name,
  };
  return jwt.sign(payload, secretKey, { expiresIn: '200h' });
};

const prisma = new PrismaClient();
const saltRounds = 7;

class AuthController {
  registration = async (req: Request, res: Response) => {
    try {
      const { nickname, password } = req.body;
      const candidate = await prisma.user.findFirst({
        where: { nickname: nickname },
      });
      if (candidate) {
        return res.status(400).json({ message: `user ${nickname} already exist` });
      }
      const hash = bcrypt.hashSync(password, saltRounds);

      const user = {
        ...req.body,
      };

      const newUser = await prisma.user.create({
        data: { ...user, password: hash },
      });
      res.json(newUser);
    } catch (error) {
      res.status(400).json({ message: 'reg error, try again' });
    }
  };
  login = async (req: Request, res: Response) => {
    const { nickname, password } = req.body;

    const candidate = await prisma.user.findFirst({
      where: { nickname: nickname },
      include: {
        cs2_data: {
          include: {
            roles: { select: { cs2Role: { select: { name: true } } } },
            maps: { select: { cs2Map: { select: { name: true } } } },
          },
        },
        friends: { include: { cs2_data: { select: { lvlImg: true, elo: true, kd: true } } } },
        receivedRequests: {
          where: { toUser: { nickname: nickname } },
          include: { fromUser: { select: { nickname: true, user_avatar: true } } },
        },
        sentRequests: {
          include: { toUser: { select: { nickname: true, user_avatar: true } } },
        },
        teams: { include: { neededRoles: true, teamRequests: true, members: { include: { user: true, role: true } } } },

        requestsToTeam: { include: { team: true, role: true } },
        memberOf: { include: { role: true, team: { include: { members: true } } } },
      },
    });
    if (!candidate) {
      return res.status(404).json('Uncorrect login or password');
    }

    const validPassword = bcrypt.compareSync(password, candidate.password);

    if (!validPassword) {
      return res.status(404).json('Uncorrect login or password');
    }
    const token = generateAccessToken(candidate.id, candidate.nickname);
    const cookieLifeTime = 10 * 24 * 60 * 60 * 1000;
    return res
      .cookie('token', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: cookieLifeTime,
      })
      .json({ ...candidate, password: undefined, email: undefined });
  };
  check = async (req: Request, res: Response) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(404).json({ message: 'user not authorized' });
      }
      const user: JwtUser = jwt.verify(token, secretKey) as JwtUser;

      const candidate = await prisma.user.findFirst({
        where: { nickname: user.name },
        include: {
          cs2_data: {
            include: {
              roles: { select: { cs2Role: { select: { name: true } } } },
              maps: { select: { cs2Map: { select: { name: true } } } },
            },
          },
          friends: { include: { cs2_data: { select: { lvlImg: true, elo: true, kd: true } } } },

          receivedRequests: { where: { toUserId: user.id }, include: { fromUser: { select: { nickname: true, user_avatar: true } } } },
          sentRequests: { where: { fromUserId: user.id }, include: { toUser: { select: { nickname: true, user_avatar: true } } } },
          teams: { include: { neededRoles: true, teamRequests: true, members: { include: { user: true, role: true } } } },
          requestsToTeam: { include: { team: true, role: true } },
          memberOf: { include: { role: true, team: { include: { members: true } } } },
        },
      });

      if (candidate) {
        return res.status(200).json({
          ...candidate,
          password: undefined,
          email: undefined,
        });
      } else return res.json(false);
    } catch (e) {
      return res.status(403).json({ message: 'user not authorized' });
    }
  };
}

export default new AuthController();
