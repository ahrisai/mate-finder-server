import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { capitalizeWord } from '../util/capitalizeWord.js';
const prisma = new PrismaClient();
const saltRounds = 7;
const playersPerPage = 5;

async function getPlayers(
  sortField: string,
  sortOrder: string,
  cs2_dataInclude: boolean,
  description: boolean,
  user_avatar: boolean,
  gender: string,
  pageNumber: number,
  searchQuery: string,
  filterQuery: string
) {
  const playersPerPage = 5,
    skip = (pageNumber - 1) * playersPerPage;
  const whereClause = {
    nickname: { not: 'admin' },
    gender: gender !== '' ? gender : {},
    user_avatar: user_avatar ? { not: '' } : {},
    description: description ? { not: '' } : {},
    cs2_data: cs2_dataInclude ? { isNot: null } : {},
    ...(searchQuery ? { [filterQuery]: { contains: searchQuery } } : {}),
  };
  return await prisma.user.findMany({
    where: whereClause,
    orderBy: sortField ? { [sortField]: sortOrder } : {},
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
}

async function getTotalPages(
  sortField: string,
  sortOrder: string,
  cs2_dataInclude: boolean,
  description: boolean,
  user_avatar: boolean,
  gender: string
) {
  const playersPerPage = 5;
  let orderByClause = sortField ? { [sortField]: sortOrder } : {};
  let cs2_dataWith = cs2_dataInclude ? { isNot: null } : {};
  let descClause = description ? { not: '' } : {};
  let genderClause = gender !== '' ? gender : {};
  let user_avatarClause = user_avatar ? { not: '' } : {};
  const count = await prisma.user.count({
    where: {
      nickname: { not: 'admin' },
      gender: genderClause,
      user_avatar: user_avatarClause,
      description: descClause,
      cs2_data: cs2_dataWith,
    },
    orderBy: orderByClause,
  });
  const totalCount = Number((count / playersPerPage).toFixed(1));
  if (totalCount % 1 >= 0.2 && totalCount % 1 <= 0.8) {
    return Math.floor(totalCount) + 1;
  } else return Math.floor(count / playersPerPage);
}

class AdminController {
  updatePlayerById = async (req: Request, res: Response) => {
    try {
      if (typeof req.query.id === 'string') {
        const Uid = parseInt(req.query.id);

        await prisma.user.updateMany({ where: { id: Uid }, data: req.body });

        const players = await prisma.user.findMany({
          where: { nickname: { not: 'admin' } },
          orderBy: { id: 'asc' },
          include: { cs2_data: true },
        });

        return res.status(200).json(players);
      }
    } catch (error) {
      console.log(error);
    }
  };

  fetchAllPlayers = async (req: Request, res: Response) => {
    const { filter, sort, cs2_data, desc, user_avatar, gender, page, searchQuery, searchFilter } = req.query;
    let bool_cs2_data: boolean;
    let bool_desc: boolean;
    let bool_user_avatar: boolean;

    if (cs2_data && desc && page) {
      bool_cs2_data = cs2_data === 'true';
      bool_desc = desc === 'true';
      bool_user_avatar = user_avatar === 'true';
      const nPage: number = +page;
      try {
        const players = await getPlayers(
          filter as string,
          sort as string,
          bool_cs2_data,
          bool_desc,
          bool_user_avatar,
          gender as string,
          nPage,
          searchQuery as string,
          searchFilter as string
        );

        const totalPages = await getTotalPages(
          filter as string,
          sort as string,
          bool_cs2_data,
          bool_desc,
          bool_user_avatar,
          gender as string
        );
        return res.status(200).json({ totalPages, players });
      } catch (error) {}
    }
  };

  deletePlayerById = async (req: Request, res: Response) => {
    const id = typeof req.query.id === 'string' ? parseInt(req.query.id) : undefined;

    if (id !== undefined) {
      await prisma.user.delete({ where: { id: id } });
    }

    const players = await prisma.user.findMany({
      where: { nickname: { not: 'admin' } },
      orderBy: { id: 'asc' },
      include: { cs2_data: true },
    });
    res.status(200).json(players);
  };

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
        return res.status(200).json({ ...player, password: undefined });
      }
    } catch (error) {
      return res.status(500).json('eternal server error =<');
    }
  };
  createPlayer = async (req: Request, res: Response) => {
    try {
      const { nickname, password } = req.body;
      console.log(req.body);
      const candidate = await prisma.user.findFirst({
        where: { nickname: nickname },
      });
      if (candidate) {
        return res.status(400).json({ message: `user ${nickname} already exist` });
      }
      const hash = bcrypt.hashSync(password, saltRounds);

      const user = {
        ...req.body,
      };
      console.log('user');

      await prisma.user.create({
        data: { ...user, password: hash },
      });
      const players = await prisma.user.findMany({
        where: { nickname: { not: 'admin' } },
        orderBy: { id: 'asc' },
        include: { cs2_data: true },
      });

      res.status(200).json(players);
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: 'reg error, try again' });
    }
  };

  totalPages = async (req: Request, res: Response) => {
    const totalUsers = await prisma.user.count();
    const totalPages = Math.round(totalUsers / playersPerPage);
    res.status(200).json(totalPages);
  };

  fetchAllMaps = async (req: Request, res: Response) => {
    const searchQuery = req.query.searchQuery as string;

    const maps = await prisma.cs2Maps.findMany({
      where: { name: searchQuery ? { contains: capitalizeWord(searchQuery) } : { not: '' } },
    });
    return res.json(maps);
  };
  createMap = async (req: Request, res: Response) => {
    const { name } = req.body;

    await prisma.cs2Maps.create({
      data: { name: name as string },
    });

    const maps = await prisma.cs2Maps.findMany();
    return res.json(maps);
  };
  editMap = async (req: Request, res: Response) => {
    const { id, name } = req.body;

    await prisma.cs2Maps.update({
      where: { id: id },
      data: { name: name },
    });

    const maps = await prisma.cs2Maps.findMany();
    return res.json(maps);
  };
  deleteMap = async (req: Request, res: Response) => {
    const { id } = req.query;
    const _id = Number(id);
    await prisma.cs2Maps.delete({
      where: { id: _id },
    });

    const maps = await prisma.cs2Maps.findMany();
    return res.json(maps);
  };
}

export default new AdminController();
