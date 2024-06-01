import { Router } from 'express';
import TeamController from '../controllers/TeamController.js';

const teamRouter = Router();

teamRouter.post('/create/:userId', TeamController.createTeam);
teamRouter.put('/update/:id', TeamController.updateTeam);
teamRouter.get('/team/:name', TeamController.fetchTeam);
teamRouter.get('/updatedTeam/:id', TeamController.fetchUpdatedTeam);
teamRouter.delete('/kickPlayer', TeamController.kickPlayer);
teamRouter.delete('/deleteTeam', TeamController.deleteTeam);
teamRouter.get('/teams', TeamController.fetchTeamsList);

export default teamRouter;
