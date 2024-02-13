import { Router } from 'express';

import PlayerController from '../controllers/PlayerController.js';

const playerRouter = Router();

playerRouter.get('/playerByName', PlayerController.fetchPlayerByName);

export default playerRouter;
