import { Router } from 'express';
import TeamController from '../controllers/TeamController.js';

const teamRouter = Router();

teamRouter.post('/create/:userId', TeamController.createTeam);
teamRouter.put('/update/:id', TeamController.updateTeam);
teamRouter.get('/team/:name', TeamController.fetchTeam);
teamRouter.get('/updatedTeam/:id', TeamController.fetchUpdatedTeam);

export default teamRouter;
