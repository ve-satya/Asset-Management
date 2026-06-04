import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  code?: string;
  status?: number;
}

function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err.stack);

  if (err.code === 'P2002') {
    res.status(409).json({ error: 'A record with this API Name already exists.' });
    return;
  }
  if (err.code === 'P2025') {
    res.status(404).json({ error: 'Record not found.' });
    return;
  }
  if (err.code === 'P2003') {
    res.status(400).json({ error: 'Invalid parent reference.' });
    return;
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
}

export default errorHandler;
