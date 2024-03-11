import { Router } from 'express';

import PlayerController from '../controllers/PlayerController.js';

const playerRouter = Router();

playerRouter.get('/playerByName', PlayerController.fetchPlayerByName);
playerRouter.get('/players', PlayerController.fetchPlayers);

export default playerRouter;
