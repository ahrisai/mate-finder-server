import { PrismaClient, Team, TeamRequest } from '@prisma/client';
import { Request, Response } from 'express';
import { emitter } from '../Emitter.js';
import { FETCH_TEAM_EVENT, FETCH_UPDATED_USER_EVENT } from '../consts/TeamRequests.js';

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
            user: true,
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
          user: { select: { id: true, nickname: true, user_avatar: true, cs2_data: true } },
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
              members: { select: { id: true, user_avatar: true, nickname: true } },
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
    const id = +req.params.id;

    emitter.once(FETCH_TEAM_EVENT + id, (team) => {
      if (team.id == id) return res.status(200).json(team);
    });
  };

  updateTeam = async (req: Request, res: Response) => {
    const id: number = +req.params.id;

    const { avatar, name, ownerRole, description, neededRoles, public: isPublic, teamRequests, members } = req.body;

    if (id) {
      const dbReqs = await prisma.teamRequest.findMany({ where: { teamId: id } });
      const currentTeamRequestIds = dbReqs.map((request) => request.id);
      const incomingTeamRequestIds = teamRequests.map((request: { id: number }) => request.id);
      const disconnectedReqsIds = currentTeamRequestIds.filter((id) => !incomingTeamRequestIds.includes(id)).map((id) => ({ id }));

      const team = await prisma.team.update({
        where: { id },
        data: {
          avatar,
          name,
          ownerRole,
          description,
          public: isPublic,
          neededRoles: {
            set: neededRoles.map((role: { id: number }) => ({ id: role.id })),
          },
          teamRequests: {
            deleteMany: disconnectedReqsIds,
          },
          members: {
            updateMany: members.map((member: any) => ({
              where: { id: member.id },
              data: { roleId: member.roleId },
            })),
          },
        },
        include: {
          members: { include: { user: { include: { cs2_data: true } }, role: true } },
          neededRoles: true,
          user: { select: { id: true, nickname: true, user_avatar: true, cs2_data: true } },
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
              members: { select: { id: true, user_avatar: true, nickname: true } },
            },
          },
        },
      });
      if (team) {
        emitter.emit(FETCH_TEAM_EVENT + id, team);
        return res.status(202).json(team);
      } else {
        return res.status(404).json('not found');
      }
    }

    return res.status(200);
  };

  kickPlayer = async (req: Request, res: Response) => {
    const memberId: number = Number(req.query.memberId);
    const deletedMember = await prisma.memberShip.delete({ where: { id: memberId }, select: { id: true, toUserId: true, teamId: true } });
    emitter.emit(FETCH_UPDATED_USER_EVENT + deletedMember.toUserId);
    return res.status(200).json(deletedMember);
  };
}

export default new TeamController();
