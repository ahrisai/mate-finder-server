import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getPlayersWithFilters = async (
  nickname: string,
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

  const players = await prisma.user.findMany({
    where: {
      nickname: searchQuery
        ? {
            not: { in: ['admin', nickname] },
            contains: searchQuery,
          }
        : {
            not: { in: ['admin', nickname] },
          },
      gender: gender !== '' ? gender : {},
      age: ageClause,
      cs2_data: {
        elo: eloClause,
        hs: hsClause,
        winrate: winrateClause,
        kd: kdClause,
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
  });

  const totalCount = await prisma.user.count({
    where: {
      nickname: searchQuery
        ? {
            not: { in: ['admin', nickname] },
            contains: searchQuery,
          }
        : {
            not: { in: ['admin', nickname] },
          },
      gender: gender !== '' ? gender : {},
      age: ageClause,
      cs2_data: {
        elo: eloClause,
        hs: hsClause,
        winrate: winrateClause,
        kd: kdClause,
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
    const totalPages = totalCount / playersPerPage;
    console.log(totalPages);
    let pages = 1;
    if (totalPages > 1 && totalPages < 2) {
      pages = Math.round(totalPages) + 1;
    }

    return { players, pages };
  } else {
    return 0;
  }
};
