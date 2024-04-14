import { Router } from 'express';

import UserController from '../controllers/UserController.js';

const userRouter = Router();

userRouter.patch('/updateUser', UserController.updateUser);

export default userRouter;
