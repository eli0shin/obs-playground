import './otel.js';
import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Express server is running!' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
