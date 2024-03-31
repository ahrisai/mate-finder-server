import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { JwtUser } from '../queryTypes.js';

const prisma = new PrismaClient();

class ChatController {
  fetchChats = async (req: Request, res: Response) => {
    console.log('chats');

    const jwtUser = req.user as JwtUser;
    try {
      const chats = await prisma.chat.findMany({
        where: { members: { some: { id: jwtUser.id } } },
        include: { members: { select: { id: true, nickname: true, user_avatar: true } }, messages: true },
      });
      console.log(chats);
      return res.status(200).json(chats);
    } catch (error) {
      console.log(error);
    }
  };
}

export default new ChatController();
