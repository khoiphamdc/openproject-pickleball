export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: any, _req: any, res: any, _next: any) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'INTERNAL', message: 'Unexpected error' });
}