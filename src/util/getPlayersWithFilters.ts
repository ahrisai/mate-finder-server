import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getPlayersWithFilters = async (
  idValue: number,
  gender?: string,
  pageNumber: number = 1,
  searchQuery?: string,
  minAge?: number,
  maxAge?: number,
  maxEloValue?: number,
  minEloValue?: number,
  maxHsValue?: number,
  minHsValue?: number,
  maxKdValue?: number,
  minKdValue?: number,
  maxWinrateValue?: number,
  minWinrateValue?: number,
  minMatchesValue?: number,
  maxMatchesValue?: number,
  roles?: string[],
  maps?: string[]
) => {
  const playersPerPage = 10;

  const skip: number = (pageNumber - 1) * playersPerPage;
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

  const matchesClause = {
    gte: minMatchesValue ? minMatchesValue : undefined,
    lte: maxMatchesValue ? maxMatchesValue : undefined,
  };

  const players = await prisma.user.findMany({
    where: {
      id: { not: idValue },
      nickname: searchQuery
        ? {
            not: { in: ['admin'] },
            contains: searchQuery,
          }
        : {
            not: { in: ['admin'] },
          },

      gender: gender !== '' ? gender : {},
      age: ageClause,

      cs2_data: {
        NOT: undefined,
        elo: eloClause,
        hs: hsClause,
        winrate: winrateClause,
        kd: kdClause,
        matches: matchesClause,

        roles: roles
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
        maps: maps
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

    take: playersPerPage,
    skip: skip,
    orderBy: { cs2_data: { matches: 'asc' } },
  });

  const totalCount = await prisma.user.count({
    where: {
      id: { not: idValue },
      nickname: searchQuery
        ? {
            not: { in: ['admin'] },
            contains: searchQuery,
          }
        : {
            not: { in: ['admin'] },
          },
      gender: gender !== '' ? gender : {},
      age: ageClause,
      cs2_data: {
        NOT: undefined,
        elo: eloClause,
        hs: hsClause,
        winrate: winrateClause,
        kd: kdClause,
        matches: matchesClause,

        roles: roles
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
        maps: maps
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
  });
  if (players.length) {
    let pages = 1;

    const total = Number((totalCount / playersPerPage).toFixed(1));
    console.log(totalCount);
    console.log(total);
    if (total % 1 >= 0.1 && total % 1 <= 0.9) {
      pages = Math.floor(total) + 1;
    } else pages = Math.ceil(total / playersPerPage);

    return { players, pages };
  } else {
    return 0;
  }
};
