import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import authRouter from './routes/auth.routes.js';
import coursesRouter from './routes/courses.routes.js';
import userRouter from './routes/user.routes.js'
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());
app.use(cors())
app.use('/api', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/user', userRouter);
app.listen(PORT, () => console.log(`Server has been started on port ${PORT}`));