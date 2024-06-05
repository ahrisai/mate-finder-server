import { PrismaClient, Team, TeamRequest } from '@prisma/client';
import { Request, Response } from 'express';
import { emitter } from '../Emitter.js';
import { FETCH_TEAM_EVENT, FETCH_UPDATED_USER_EVENT } from '../consts/TeamRequests.js';

const prisma = new PrismaClient();

class TeamController {
  createTeam = async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const newTeam = req.body;

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
              create: newTeam.teamRequests.map((req: { roleId: number; toUserId: number; isFromTeam: boolean }) => ({
                user: {
                  connect: { id: req.toUserId },
                },
                role: {
                  connect: {
                    id: req.roleId,
                  },
                },
                isFromTeam: req.isFromTeam,
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

    emitter.once(FETCH_TEAM_EVENT + id, async () => {
      const team = await prisma.team.findFirst({
        where: { id },

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
        return res.status(200).json(team);
      } else {
        return res.status(404).json('not found');
      }
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
        emitter.emit(FETCH_TEAM_EVENT + id);
        return res.status(202).json(team);
      } else {
        return res.status(404).json('not found');
      }
    }
  };

  kickPlayer = async (req: Request, res: Response) => {
    const memberId: number = Number(req.query.memberId);
    const deletedMember = await prisma.memberShip.delete({
      where: { id: memberId },
      select: { id: true, toUserId: true, teamId: true, roleId: true },
    });
    await prisma.team.update({ where: { id: deletedMember.teamId }, data: { neededRoles: { connect: { id: deletedMember.roleId } } } });

    emitter.emit(FETCH_UPDATED_USER_EVENT + deletedMember.toUserId);
    emitter.emit(FETCH_TEAM_EVENT + deletedMember.teamId);

    return res.status(200).json(deletedMember);
  };

  deleteTeam = async (req: Request, res: Response) => {
    const teamId: number = Number(req.query.teamId);
    const teamName: string = req.query.name as string;

    await prisma.chat.delete({ where: { roomId: teamName } });
    const deletedTeam = await prisma.team.delete({ where: { id: teamId }, include: { chat: true, members: true, teamRequests: true } });

    deletedTeam.members.forEach((member) => {
      emitter.emit(FETCH_UPDATED_USER_EVENT + member.toUserId);
    });
    deletedTeam.teamRequests.forEach((req) => {
      emitter.emit(FETCH_UPDATED_USER_EVENT + req.toUserId);
    });
    emitter.emit(FETCH_TEAM_EVENT + deletedTeam.id);
    return res.status(200).json(teamId);
  };

  fetchTeamsList = async (req: Request, res: Response) => {
    const { searchQuery, page, maxElo, minElo, minAge, maxAge, minWinrate, maxWinrate, minMembersAmount, maxMembersAmount, roles, userId } =
      req.query;
    const id = Number(userId);

    const pageNumber = Number(page);
    const maxEloValue = Number(maxElo);
    const minEloValue = Number(minElo);
    const minWinrateValue = Number(minWinrate);
    const maxWinrateValue = Number(maxWinrate);
    const minAgeValue = Number(minAge);
    const maxAgeValue = Number(maxAge);
    const maxMembersAmountValue = Number(maxMembersAmount);
    const minMembersAmountValue = Number(minMembersAmount);

    const name = searchQuery as string;
    const neededRoles = roles as string[];
    const teamsPerPage = 10;

    const skip: number = (pageNumber - 1) * teamsPerPage;
    const eloClause = {
      gte: minEloValue ? minEloValue : undefined,
      lte: maxEloValue ? maxEloValue : undefined,
    };
    const winrateClause = {
      gte: minWinrateValue ? minWinrateValue : undefined,
      lte: maxWinrateValue ? maxWinrateValue : undefined,
    };

    const ageClause = {
      gte: minAgeValue ? minAgeValue : undefined,
      lte: maxAgeValue ? maxAgeValue : undefined,
    };
    const teams = await prisma.team.findMany({
      where: {
        userId: { not: id },
        public: true,
        name: name ? { contains: name } : undefined,
        neededRoles: neededRoles
          ? {
              some: { name: { in: neededRoles } },
            }
          : {},
        user: { cs2_data: { elo: eloClause, winrate: winrateClause }, age: ageClause },
        members: {
          some: { user: { cs2_data: { elo: eloClause, winrate: winrateClause }, age: ageClause } },
          every: { user: { NOT: { id: id } } },
        },
      },

      include: {
        user: { select: { cs2_data: true, age: true, id: true } },
        members: { select: { user: { select: { cs2_data: true, age: true, id: true } } } },
        neededRoles: { orderBy: { id: 'asc' } },
      },
      skip,
      take: teamsPerPage,
    });

    const allTeams = await prisma.team.findMany({
      where: {
        userId: { not: id },
        public: true,

        name: name ? { contains: name } : undefined,
        neededRoles: neededRoles
          ? {
              some: { name: { in: neededRoles } },
            }
          : {},
        user: { cs2_data: { elo: eloClause, winrate: winrateClause }, age: ageClause },
        members: { some: { user: { cs2_data: { elo: eloClause, winrate: winrateClause }, age: ageClause } } },
      },
      include: { members: { select: { id: true } } },
    });

    const filterTeamsByMembers = (team: any) => {
      const membersCount = team.members.length + 1;
      if (minMembersAmountValue && maxMembersAmountValue) {
        return membersCount >= minMembersAmountValue && membersCount <= maxMembersAmountValue;
      } else if (minMembersAmountValue) {
        return membersCount >= minMembersAmountValue;
      } else if (maxMembersAmountValue) {
        return membersCount <= maxMembersAmountValue;
      }
      return true;
    };

    const finishedTeams = teams.filter(filterTeamsByMembers);
    const totalCount = allTeams.filter(filterTeamsByMembers).length;

    const totalPages = totalCount / teamsPerPage;
    let pages = 1;
    if (totalPages > 1 && totalPages < 2) {
      pages = Math.round(totalPages) + 1;
    }

    return res.json({ teams: finishedTeams, pages });
  };
}

export default new TeamController();
