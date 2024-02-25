import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import authRouter from './routes/auth.routes.js';
import AuthMiddleware from './middlewares/AuthMiddleware.js';
import Cs2Router from './routes/cs2.routes.js';
import playerRouter from './routes/Player.routes.js';
<<<<<<< HEAD
import userRouter from './routes/user.routes.js';
=======
>>>>>>> df1007d6723afc7a09fa70bc86f80a437c7c54c4

const allowedOrigins = ['http://localhost:5173', 'http://26.173.11.127:5173', 'https://squadlink.vercel.app'];

const app = express();
app
  .use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  )
  .use(express.json())
  .use(cookieParser())
  .use(AuthMiddleware)
  .get('/', (req: Request, res: Response) => {
    res.send('hello world');
  })
  .use('/api', authRouter)
  .use('/api', Cs2Router)
<<<<<<< HEAD
  .use('/api', playerRouter)
  .use('/api', userRouter);
=======
  .use('/api', playerRouter);
>>>>>>> df1007d6723afc7a09fa70bc86f80a437c7c54c4

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
