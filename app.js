import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import authRouter from './routes/auth.routes.js';
import coursesRouter from './routes/courses.routes.js';
import userRouter from './routes/user.routes.js'
import testsRouter from './routes/tests.routes.js'
import selfRouter from './routes/self.routes.js'
import fileRouter from './routes/file.routes.js';
import groupsRouter from "./routes/groups.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());
app.use(cors())
app.use('/api', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/users', userRouter);
app.use('/api/tests', testsRouter);
app.use('/api/me', selfRouter);
app.use('/api/files', fileRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/categories', categoriesRoutes);

app.listen(PORT, () => console.log(`Server has been started on port ${PORT}`));