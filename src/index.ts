import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import authRouter from './routes/auth.routes.js';
import AuthMiddleware from './middlewares/AuthMiddleware.js';
import Cs2Router from './routes/cs2.routes.js';
import playerRouter from './routes/Player.routes.js';

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
  .use('/api', playerRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
