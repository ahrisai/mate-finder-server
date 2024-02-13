import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

class PlayerController {
  fetchPlayerByName = async (req: Request, res: Response) => {
    try {
      const name = req.query.name as string;

      const player = await prisma.user.findFirst({
        where: { nickname: name },
        include: {
          cs2_data: {
            include: {
              roles: { select: { cs2Role: { select: { name: true } } } },
              maps: { select: { cs2Map: { select: { name: true } } } },
            },
          },
        },
      });

      if (!player) {
        return res.status(404).json('user is not exist');
      } else {
        return res.status(200).json({ ...player });
      }
    } catch (error) {
      return res.status(500).json('eternal server error =<');
    }
  };
}

export default new PlayerController();
