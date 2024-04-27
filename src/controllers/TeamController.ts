import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { JwtUser } from '../queryTypes.js';

const prisma = new PrismaClient();

class TeamController {
  createTeam = async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const newTeam = req.body;
    console.log(userId);
    try {
      const mbTeam = await prisma.team.findFirst({ where: { name: newTeam.name } });
      if (mbTeam) {
        return res.status(400).json('Такая команда уже существует');
      } else {
        const team = await prisma.team.create({
          data: {
            avatar: newTeam.avatar,
            name: newTeam.name,
            ownerRole: newTeam.ownerRole,

            public: newTeam.public,
            description: newTeam.description,
            user: { connect: { id: newTeam.userId } },
            neededRoles: { connect: newTeam.neededRoles.map((role: { id: number }) => ({ id: role.id })) },
            teamRequests: {
              create: newTeam.teamRequests.map((req: { roleId: number; toUserId: number }) => ({
                user: {
                  connect: { id: req.toUserId },
                },
                role: {
                  connect: {
                    id: req.roleId,
                  },
                },
              })),
            },
          },
          include: { neededRoles: true, teamRequests: { include: { role: true, team: true, user: true } } },
        });

        return res.status(200).json(team);
      }
    } catch (error) {
      console.log(error);
    }
  };
}

export default new TeamController();
