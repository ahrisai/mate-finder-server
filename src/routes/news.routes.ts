import { Router } from 'express';

import NewsController from '../controllers/NewsController.js';

const newsRouter = Router();

newsRouter.get('/news', NewsController.fetchNews);
newsRouter.get('/news/:link', NewsController.fetchArticleById);

export default newsRouter;
