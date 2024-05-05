import { Router } from 'express';
import TeamController from '../controllers/TeamController.js';

const teamRouter = Router();

teamRouter.post('/createTeam/:userId', TeamController.createTeam);
teamRouter.get('/team/:name', TeamController.fetchTeam);

export default teamRouter;
