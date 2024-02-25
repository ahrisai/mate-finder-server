import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { Cs2Data, JwtUser } from '../queryTypes.js';
import faceitParser from '../util/faceitParser.js';
import axios from 'axios';
import cheerio from 'cheerio';
const prisma = new PrismaClient();

class Cs2Contoller {
  updateCs2Data = async (req: Request, res: Response) => {
    try {
      const steamId = req.query.steamId as string;
      const user = req.user as JwtUser;

      const { data } = await axios.get<string>(`https://faceitfinder.com/profile/${steamId}`);

      const $ = cheerio.load(data);

      const faceitData = $('.account-faceit-stats-single').text();

      if (faceitData) {
        const result = faceitParser(faceitData);
        const faceitLvl = 'https://faceitfinder.com/' + $('.account-faceit-level > a > img').attr('src');

        if (result) {
          const cs2Data: Cs2Data = {
            ...result,
            lvlImg: faceitLvl,
            steamId: steamId,
          };

          const cs2data = await prisma.cs2_data.updateMany({
            where: { userId: user.id },
            data: {
              ...cs2Data,
            },
          });
          return res.status(203).json(cs2Data);
        }
      }
    } catch (error) {}
  };

  refillingCs2data = async (req: Request, res: Response) => {
    // дозаполнение кс данных после подключения faceit
    const user: JwtUser = req.user as JwtUser;
    const { reqMaps, reqRoles } = req.body;

    const cs2data = await prisma.cs2_data.findFirst({
      where: { userId: user.id },
      include: { roles: true, maps: true },
    });

    if (cs2data) {
      if (cs2data.roles.length === 0) {
        await prisma.cs2_dataCs2Roles.createMany({
          data: reqRoles.map((id: number) => ({
            cs2RoleId: id,
            cs2_dataId: cs2data.id,
          })),
        });
      }
      if (cs2data.maps.length === 0) {
        await prisma.cs2_dataCs2Maps.createMany({
          data: reqMaps.map((id: number) => ({
            cs2MapId: id,
            cs2_dataId: cs2data.id,
          })),
        });
      }
      const responseCs2Data = await prisma.cs2_data.findFirst({
        where: { userId: user.id },
        include: {
          roles: { select: { cs2Role: { select: { name: true } } } },
          maps: { select: { cs2Map: { select: { name: true } } } },
        },
      });
      if (responseCs2Data) {
        return res.status(200).json(responseCs2Data);
      }
    }
  };
  deleteCs2data = async (req: Request, res: Response) => {
    const user: JwtUser = req.user as JwtUser;
    try {
      await prisma.cs2_data.delete({ where: { userId: user.id } });
      return res.status(200).json('deleted successfully');
    } catch (error) {
      console.log('не удалил кс2 дату');
    }
  };
}

export default new Cs2Contoller();
