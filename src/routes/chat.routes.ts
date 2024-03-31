import { Router } from 'express';

import ChatController from '../controllers/ChatController.js';

const chatRouter = Router();

chatRouter.get('/fetchChats', ChatController.fetchChats);

export default chatRouter;
