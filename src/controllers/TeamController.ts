import { PrismaClient, Team } from '@prisma/client';
import { Request, Response } from 'express';
import { emitter } from '../Emitter.js';
import { FETCH_TEAM_EVENT } from '../consts/TeamRequests.js';

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
            chat: { create: { roomId: newTeam.name, members: { connect: { id: userId } } } },
          },

          include: {
            neededRoles: true,
            teamRequests: { include: { role: true, team: true, user: true } },
            members: { include: { role: true, user: true } },
            chat: {
              include: {
                messages: {
                  include: {
                    user: { select: { id: true, nickname: true, user_avatar: true } },
                    checked: { include: { user: { select: { id: true } } } },
                  },
                },
                team: { select: { name: true, avatar: true } },
                members: { select: { user_avatar: true, nickname: true } },
              },
            },
          },
        });

        return res.status(200).json(team);
      }
    } catch (error) {
      console.log(error);
    }
  };

  fetchTeam = async (req: Request, res: Response) => {
    const { name } = req.params;

    if (name) {
      const team = await prisma.team.findFirst({
        where: { name: name },

        include: {
          members: { include: { user: { include: { cs2_data: true } }, role: true } },
          neededRoles: true,
          user: { select: { nickname: true, user_avatar: true, cs2_data: true } },
          teamRequests: { include: { role: true, user: { include: { cs2_data: true } } } },
          chat: {
            include: {
              messages: {
                include: {
                  user: { select: { id: true, nickname: true, user_avatar: true } },
                  checked: { include: { user: { select: { id: true } } } },
                },
              },
              team: { select: { name: true, avatar: true } },
              members: { select: { user_avatar: true, nickname: true } },
            },
          },
        },
      });
      if (team) {
        return res.status(202).json(team);
      } else {
        return res.status(404).json('not found');
      }
    }
  };

  fetchUpdatedTeam = async (req: Request, res: Response) => {
    const { name } = req.params;
    console.log(req.body);
    emitter.once(FETCH_TEAM_EVENT, (team) => {
      if (team.name == name) return res.status(200).json(team);
    });
  };

  updateTeam = async (req: Request, res: Response) => {
    const { name } = req.params;
    console.log(req.body);
    // if (name) {
    //   const team = await prisma.team.update({ data: updatedTeam });
    //   if (team) {
    //     return res.status(202).json(team);
    //   } else {
    //     return res.status(404).json('not found');
    //   }
    // }
    // emitter.emit(FETCH_TEAM_EVENT,);
    return res.status(200);
  };
}

export default new TeamController();
