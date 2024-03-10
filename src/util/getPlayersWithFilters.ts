import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getPlayersWithFilters(
  gender: string,
  pageNumber: number,
  searchQuery: string,
  minAge: number,
  maxAge: number,
  maxEloValue: number,
  minEloValue: number,
  maxHsValue: number,
  minHsValue: number,
  maxKdValue: number,
  minKdValue: number,
  maxWinrateValue: number,
  minWinrateValue: number,
  roles: string[],
  maps: string[]
) {
  const playersPerPage = 10;
  const skip = (pageNumber - 1) * playersPerPage;
  const ageClause = {
    gte: minAge ? minAge : undefined,
    lte: maxAge ? maxAge : undefined,
  };

  const eloClause = {
    gte: minEloValue ? minEloValue : undefined,
    lte: maxEloValue ? maxEloValue : undefined,
  };

  const hsClause = {
    gte: minHsValue ? minHsValue : undefined,
    lte: maxHsValue ? maxHsValue : undefined,
  };

  const winrateClause = {
    gte: minWinrateValue ? minWinrateValue : undefined,
    lte: maxWinrateValue ? maxWinrateValue : undefined,
  };

  const kdClause = {
    gte: minKdValue ? minKdValue : undefined,
    lte: maxKdValue ? maxKdValue : undefined,
  };

  const players = await prisma.user.findMany({
    where: {
      nickname: searchQuery
        ? {
            not: 'admin',
            contains: searchQuery,
          }
        : {
            not: 'admin',
          },
      gender: gender !== '' ? gender : {},
      age: ageClause,
      cs2_data: {
        elo: eloClause,
        hs: hsClause,
        winrate: winrateClause,
        kd: kdClause,
        // добавляем проверки на длину массивов maps и roles
        // если массив пустой, то пропускаем фильтрацию по этому полю
        // если массив не пустой, то используем оператор in
        roles:
          roles.length > 0
            ? {
                some: {
                  cs2Role: {
                    name: {
                      in: roles,
                    },
                  },
                },
              }
            : {},
        maps:
          maps.length > 0
            ? {
                some: {
                  cs2Map: {
                    name: {
                      in: maps,
                    },
                  },
                },
              }
            : {},
      },
    },
    include: {
      cs2_data: {
        include: {
          roles: { select: { cs2Role: { select: { name: true } } } },
          maps: { select: { cs2Map: { select: { name: true } } } },
        },
      },
    },

    skip: skip,
    take: playersPerPage,
  });

  const totalCount = players.length / playersPerPage;
  let pages = 0;
  if (totalCount > 1.2 && totalCount < 2) {
    pages = Math.round(totalCount) + 1;
  } else pages = Math.round(players.length / playersPerPage);

  return { players, pages };
}
