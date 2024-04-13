import { Router } from 'express';

import UserController from '../controllers/UserController.js';

const userRouter = Router();

userRouter.patch('/updateUser', UserController.updateUser);
userRouter.post('/friendRequest', UserController.friendRequest);
userRouter.post('/friendRequestAction', UserController.friendRequestAction);

export default userRouter;
