import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
const prisma = new PrismaClient();

class NewsController {
  fetchNews = async (req: Request, res: Response) => {
    let finishedNews: any = [];

    const { data } = await axios.get<string>(`https://sport.ua/cyber/counter-strike`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    const $ = cheerio.load(data);

    const title = $('.title').text();
    const news = $('.news-items').html();
    if (news) {
      const $ = cheerio.load(news);
      const newsItems: any = [];

      $('.item').each((index, element) => {
        const newsId = $(element).attr('data-news-id');
        const timestamp = $(element).attr('data-timestamp');
        const sport = $(element).find('.item-sport').text().trim();
        const time = $(element).find('.item-date').text().trim();
        const title = $(element).find('.item-title a span').text().trim();
        const link = $(element).find('.item-title a').attr('href') as string;

        const newsItem = {
          newsId,
          timestamp,
          sport,
          time,
          title,
          link: link.split('news/')[1],
        };

        newsItems.push(newsItem);
      });

      finishedNews = newsItems;
    }
    const mainArticle = $('.main-news').find('.item').html() as string;
    const findMainArticleData = cheerio.load(mainArticle);
    const mainArticleObj: any = {};
    mainArticleObj.link = findMainArticleData('a.item-img').attr('href');
    mainArticleObj.imgSrc = findMainArticleData('a.item-img img').attr('data-src');
    mainArticleObj.title = findMainArticleData('.item-title a').text().trim();
    mainArticleObj.date = findMainArticleData('.item-date').text().trim();
    mainArticleObj.text = findMainArticleData('.item-text').text().trim();

    let otherArticlesArr: any = [];
    const articles = $('.articles-items-wrap').html() as string;
    const otherArticles = cheerio.load(articles);
    if (otherArticles) {
      otherArticles('.item').each((index, element) => {
        const link = $(element).find('a.item-img').attr('href') as string;
        const imgSrc = $(element).find('a.item-img img').attr('data-src');
        const title = $(element).find('.item-title a').text().trim();
        const date = $(element).find('.item-date').text().trim();

        const article = {
          link: link.split('news/')[1],
          imgSrc,
          title,
          date,
        };

        otherArticlesArr.push(article);
      });
    }
    console.log(otherArticlesArr);
    return res.json({
      news: finishedNews,
      mainArticle: { ...mainArticleObj, link: mainArticleObj.link.split('news/')[1] },
      otherArticles: otherArticlesArr,
    });
  };
  fetchArticleById = async (req: Request, res: Response) => {
    const link = req.params.link as string;
    const { data } = await axios.get<string>('https://sport.ua/news/' + link, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    const $ = cheerio.load(data);
    const title = $('.news-v-title').text();
    const subTitle = $('.news-v-subtitle').text();
    const imgSrc = $('.news-v-main-img').attr('src');
    const text = $('.news-v-text').html();
    const finishedText = text?.replace(/data-src=/g, 'src=');
    const article = {
      title,
      subTitle,
      text: finishedText,
      imgSrc,
    };
    console.log(article);
    return res.json(article);
  };
}

export default new NewsController();
