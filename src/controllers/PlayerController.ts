import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { getPlayersWithFilters } from '../util/getPlayersWithFilters.js';
import { JwtUser } from '../queryTypes.js';

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
              recentMatches: true,
            },
          },
          friends: { include: { cs2_data: { select: { lvlImg: true, elo: true, kd: true } } } },

          teams: { include: { neededRoles: true, teamRequests: true, members: { include: { user: true, role: true } } } },
          requestsToTeam: { include: { team: true, role: true } },
          memberOf: { include: { role: true, team: { include: { members: true } } } },
        },
      });

      if (!player) {
        return res.status(404).json('user is not exist');
      } else {
        return res.status(200).json({ ...player, password: undefined });
      }
    } catch (error) {
      return res.status(500).json('eternal server error =<');
    }
  };

  fetchTopPlayers = async (req: Request, res: Response) => {
    try {
      const players = await prisma.user.findMany({
        where: { cs2_data: { isNot: null } },
        include: {
          cs2_data: {
            include: {
              roles: { select: { cs2Role: { select: { name: true } } } },
              maps: { select: { cs2Map: { select: { name: true } } } },
            },
          },
        },
        orderBy: { cs2_data: { elo: 'desc' } },
        take: 5,
      });

      if (!players) {
        return res.status(404).json('user is not exist');
      } else {
        return res.status(200).json(players);
      }
    } catch (error) {
      return res.status(500).json('eternal server error =<');
    }
  };

  fetchPlayers = async (req: Request, res: Response) => {
    try {
      const { name } = req.user as JwtUser;
      const {
        gender,
        page,
        searchQuery,
        minAge,
        maxAge,
        maxEloValue,
        minEloValue,
        maxHsValue,
        minHsValue,
        maxKdValue,
        minKdValue,
        maxWinrateValue,
        minWinrateValue,
        minMatchesValue,
        maxMatchesValue,
        roles,
        maps,
        id,
      } = req.query;
      const idValue = Number(id);

      const pageNumberValue = Number(page);
      const minAgeValue = Number(minAge);
      const maxAgeValue = Number(maxAge);
      const maxEloValueNumber = Number(maxEloValue);
      const minEloValueNumber = Number(minEloValue);
      const maxHsValueNumber = Number(maxHsValue);
      const minHsValueNumber = Number(minHsValue);
      const maxKdValueNumber = Number(maxKdValue);
      const minKdValueNumber = Number(minKdValue);
      const maxWinrateValueNumber = Number(maxWinrateValue);
      const minWinrateValueNumber = Number(minWinrateValue);
      const minMatchesValueNumber = Number(minMatchesValue);
      const maxMatchesValueNumber = Number(maxMatchesValue);

      const playersAndPages = await getPlayersWithFilters(
        idValue,
        gender as string,
        pageNumberValue,
        searchQuery as string,
        minAgeValue,
        maxAgeValue,
        maxEloValueNumber,
        minEloValueNumber,
        maxHsValueNumber,
        minHsValueNumber,
        maxKdValueNumber,
        minKdValueNumber,
        maxWinrateValueNumber,
        minWinrateValueNumber,
        minMatchesValueNumber,
        maxMatchesValueNumber,
        roles as string[],
        maps as string[]
      );
      return res.status(202).json(playersAndPages);
    } catch (error) {
      console.log(error);
    }
  };
}

export default new PlayerController();
