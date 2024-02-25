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
        where: { id: jwtUser.id },
        include: {
          cs2_data: {
            include: {
              roles: { select: { cs2Role: { select: { name: true } } } },
              maps: { select: { cs2Map: { select: { name: true } } } },
            },
          },
        },
      });
      res.status(200).json(newUser);
    }
  };
}

export default new UserController();
