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
  friendRequest = async (req: Request, res: Response) => {
    const { fromUserId, toUserId } = req.body;
    try {
      const isExist = await prisma.friendRequest.findFirst({
        where: {
          fromUserId,
          toUserId,
        },
      });
      if (isExist) {
        return res.status(400).json('Уже отправлен');
      } else {
        const response = await prisma.friendRequest.create({
          data: {
            fromUserId,
            toUserId,
          },
        });
        const friendRequest = await prisma.friendRequest.findFirst({
          where: {
            fromUserId,
            toUserId,
          },
          include: {
            fromUser: true,
            toUser: true,
          },
        });
        return res.status(202).json(response);
      }
    } catch (error) {
      console.log(error);
    }
  };
  friendRequestAction = async (req: Request, res: Response) => {
    const { accept, requestId } = req.body;
    if (accept) {
      try {
        const friendRequest = await prisma.friendRequest.findFirst({ where: { id: requestId } });
        if (friendRequest) {
          const fromUser = await prisma.user.findUnique({ where: { id: friendRequest.fromUserId } });
          const toUser = await prisma.user.findUnique({ where: { id: friendRequest.toUserId } });

          if (fromUser && toUser) {
            await prisma.user.update({
              where: { id: friendRequest.fromUserId },
              data: {
                friends: {
                  connect: { id: friendRequest.toUserId },
                },
              },
            });

            await prisma.user.update({
              where: { id: friendRequest.toUserId },
              data: {
                friends: {
                  connect: { id: friendRequest.fromUserId },
                },
              },
            });

            const response = await prisma.friendRequest.delete({
              where: { id: requestId },
            });

            return res.status(202).json(response);
          }
        }
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something went wrong' });
      }
    } else {
      // Handle reject logic here
    }
  };
}

export default new UserController();
