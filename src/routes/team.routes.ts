import { Router } from 'express';
import TeamController from '../controllers/TeamController.js';

const teamRouter = Router();

teamRouter.post('/createTeam/:userId', TeamController.createTeam);

export default teamRouter;
