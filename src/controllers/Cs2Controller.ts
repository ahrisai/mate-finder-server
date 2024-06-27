import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { JwtUser } from '../queryTypes.js';

import axios from 'axios';
import cheerio from 'cheerio';
import { parseRelativeDate } from '../util/parseRelativeDate.js';

const prisma = new PrismaClient();

class Cs2Contoller {
  updateCs2Data = async (req: Request, res: Response) => {
    try {
      const steamId = (req.query.steamId as string).trim();
      const id = Number(req.query.id);
      const { data } = await axios.get<string>(`https://faceittracker.net/steam-profile/${steamId}`, { withCredentials: false });

      const $ = cheerio.load(data);
      const playerLinkElement = $('a.faceit_profile-link');
      const playerName = playerLinkElement.find('div.left').text().trim();
      const playerLevelImgSrc = 'https://faceittracker.net' + playerLinkElement.find('div.right img.lvl').attr('src');
      if (playerName) {
        const { data } = await axios.get<string>(`https://faceittracker.net/players/${playerName}`, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        const $ = cheerio.load(data);

        const elo = parseInt($('span.player-elo').text());
        const statsCards = $('.stats-card-wrapper .stats-card');

        let stats: any = {};

        statsCards.each((index, element) => {
          const title = $(element).find('.stats-card-title').text().trim();
          const rate = $(element).find('.stats-card-rate').text().trim();
          stats[title] = rate;
        });
        console.log(steamId);

        const totalWinsElement = $('li')
          .filter((i, el) => $(el).text().trim() === 'Total Win:')
          .next();
        const totalWins = parseInt(totalWinsElement.text().trim());
        const kd = parseFloat(stats['K/D Ratio']);
        const hs = parseFloat(stats['Headshots']);
        const totalMatches = parseInt(stats['Matches']);
        const winrate = parseFloat(stats['Winrate']);
        const recentMatches = $('.r-macthes-wrapper').html();
        const matchCards = $('a[rel="nofollow"] .r-macthes-card');

        let matches: any = [];

        matchCards.each((index, element) => {
          let match: any = {};
          const infoBlocks = $(element).find('.r-macthes-info');

          infoBlocks.each((i, block) => {
            const title = $(block).find('.title, .result').text().trim();
            const value = $(block).find('span').text().trim();

            if (title === '') {
              match.map = value;
            } else if (title === 'K - A - D') {
              match.kad = value;
            } else if (title === 'Elo Point') {
              match.eloChange = value;
            } else if (title === 'Loss' || title === 'Win') {
              match.result = title === 'Loss' ? false : true;
              match.stat = value;
            } else if (title === 'Rating') {
              match.kd = parseFloat(value);
            } else if (title === 'Date') {
              if (!value.includes('ago')) {
                const dateString = value.replace(' - ', ' ');
                match.date = new Date(dateString);
              } else {
                match.date = parseRelativeDate(value);
              }
            } else match[title.toLowerCase()] = value;
            const matchLink = $(element).parent().attr('href');
            match.link = 'https://faceittracker.net' + matchLink;
          });

          matches.push(match);
        });

        if (totalWins) {
          const cs2Data: any = {
            lvlImg: playerLevelImgSrc,
            steamId,
            elo,
            hs,
            matches: totalMatches,
            winrate,
            kd,
            wins: totalWins,
          };

          const currentCs2Data = await prisma.cs2_data.findFirst({ where: { userId: id } });
          console.log(currentCs2Data);
          if (currentCs2Data) {
            const newCs2Data = await prisma.cs2_data.update({
              where: { userId: id },
              data: {
                elo: cs2Data.elo,
                hs: cs2Data.hs,
                kd: cs2Data.kd,
                matches: cs2Data.matches,
                lvlImg: cs2Data.lvlImg,
                winrate: cs2Data.winrate,
                recentMatches: {
                  deleteMany: { cs2DataId: currentCs2Data.id },
                  createMany: { data: matches },
                },
              },
              include: {
                recentMatches: true,
                roles: { select: { cs2Role: { select: { id: true, name: true } } } },
                maps: { select: { cs2Map: { select: { id: true, name: true } } } },
              },
            });

            return res.status(203).json(newCs2Data);
          }
        }
      }
    } catch (error) {}
  };

  refillingCs2data = async (req: Request, res: Response) => {
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

  fetchMaps = async (req: Request, res: Response) => {
    const maps = await prisma.cs2Maps.findMany({});
    const mapsArr = maps.map((map) => ({ id: map.id, value: map.name, label: map.name }));
    return res.json(mapsArr);
  };

  updateRolesAndMaps = async (req: Request, res: Response) => {
    const user: JwtUser = req.user as JwtUser;
    const { reqMaps, reqRoles } = req.body;

    const cs2data = await prisma.cs2_data.findFirst({
      where: { userId: user.id },
    });

    if (cs2data) {
      await prisma.cs2_dataCs2Roles.deleteMany({ where: { cs2_dataId: cs2data.id } });
      await prisma.cs2_dataCs2Maps.deleteMany({ where: { cs2_dataId: cs2data.id } });
      await prisma.cs2_dataCs2Maps.createMany({
        data: reqMaps.map((id: number) => ({
          cs2MapId: id,
          cs2_dataId: cs2data.id,
        })),
      });
      await prisma.cs2_dataCs2Roles.createMany({
        data: reqRoles.map((id: number) => ({
          cs2RoleId: id,
          cs2_dataId: cs2data.id,
        })),
      });

      const updatedData = await prisma.cs2_data.findFirst({
        where: { id: cs2data.id },

        include: {
          roles: { select: { cs2Role: { select: { name: true } } } },
          maps: { select: { cs2Map: { select: { name: true } } } },
        },
      });
      if (updatedData) {
        return res.json(updatedData);
      }
    }
  };
}

export default new Cs2Contoller();
