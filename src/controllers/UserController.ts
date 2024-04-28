import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { JwtUser } from '../queryTypes.js';

const prisma = new PrismaClient();

class UserController {
  updateUser = async (req: Request, res: Response) => {
    const jwtUser = req.user as JwtUser;
    const updatedData = req.body;
    const candidate = await prisma.user.findFirst({ where: { id: jwtUser.id } });

    if (candidate) {
      const mergedUserData = Object.assign({}, candidate, updatedData);
      await prisma.user.update({ where: { id: jwtUser.id }, data: mergedUserData });
      const newUser = await prisma.user.findFirst({
        where: { nickname: jwtUser.name },
        include: {
          cs2_data: {
            include: {
              roles: { select: { cs2Role: { select: { name: true } } } },
              maps: { select: { cs2Map: { select: { name: true } } } },
            },
          },
          friends: { include: { cs2_data: { select: { lvlImg: true, elo: true, kd: true } } } },

          receivedRequests: { where: { toUserId: jwtUser.id }, include: { fromUser: { select: { nickname: true, user_avatar: true } } } },
          sentRequests: { where: { fromUserId: jwtUser.id }, include: { toUser: { select: { nickname: true, user_avatar: true } } } },
          teams: { include: { members: { include: { user: true, role: true } } } },
        },
      });
      res.status(200).json(newUser);
    }
  };
}

export default new UserController();
