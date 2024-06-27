import { Router } from 'express';

import Cs2Controller from '../controllers/Cs2Controller.js';

const Cs2Router = Router();

Cs2Router.patch('/refillCs2', Cs2Controller.refillingCs2data);
Cs2Router.patch('/updateCs2', Cs2Controller.updateCs2Data);
Cs2Router.delete('/deleteCs2data', Cs2Controller.deleteCs2data);
Cs2Router.patch('/updateRolesAndMaps', Cs2Controller.updateRolesAndMaps);
Cs2Router.get('/maps', Cs2Controller.fetchMaps);

export default Cs2Router;
