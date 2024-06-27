import { Router } from 'express';

import AdminController from '../controllers/AdminController.js';

const adminRouter = Router();

adminRouter.get('/playerByName', AdminController.fetchPlayerByName);

adminRouter.get('/fetchAllPlayers', AdminController.fetchAllPlayers);
adminRouter.delete('/deletePlayerById', AdminController.deletePlayerById);
adminRouter.patch('/updatePlayerById', AdminController.updatePlayerById);
adminRouter.post('/createPlayer', AdminController.createPlayer);

adminRouter.get('/fetchAllMaps', AdminController.fetchAllMaps);
adminRouter.post('/createMap', AdminController.createMap);
adminRouter.delete('/deleteMap', AdminController.deleteMap);
adminRouter.put('/updateMap', AdminController.editMap);

export default adminRouter;
