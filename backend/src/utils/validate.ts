import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Using z.ZodTypeAny handles any Zod schema object perfectly
export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid request payload',
          // Using .issues maps perfectly without TypeScript throwing a fit
          errors: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
        });
      } else {
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
      }
    }
  };
};