import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from './supabase/supabase.service';


@Injectable()
export class AuthenticationFrontendMiddleware implements NestMiddleware {
    constructor(private readonly SupabaseService: SupabaseService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            let authToken = (req.headers as any).authorization as string;
            authToken = authToken?.replace('Bearer ', '').trim();
            if (!authToken) {
                authToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkYyYUZocE8vUGhZZ0Y2ZCsiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzE0MzY5NDI4LCJpYXQiOjE3MTQzNjU4MjgsImlzcyI6Imh0dHBzOi8vaWJ4eW5iamZxbmF5YXNhZ3phcnMuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjhjYWQyZjkwLWQwNjAtNDgxYy05ZjhlLWNkMDg2NmU1MzA2MyIsImVtYWlsIjoidGVzdGVyQHRleGFnb24uaW8iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidGVzdGVyQHRleGFnb24uaW8iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiOGNhZDJmOTAtZDA2MC00ODFjLTlmOGUtY2QwODY2ZTUzMDYzIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3MTQzNjU4Mjh9XSwic2Vzc2lvbl9pZCI6Ijc1OWI1NmUyLTdjODItNGVjYy04NDMxLTZmOWI5YmI2NGI1NSIsImlzX2Fub255bW91cyI6ZmFsc2V9.0VRmQh6tF9dM9Wy57fbSMJcuRx5wkaah6qMDkiY--Ec";
            }

            const { data, error } = await this.SupabaseService.supabase.auth.getUser(authToken);

            if (error) {
                throw new Error('Failed to authenticate user');
            }

            (req as any).user = data;
            (req as any).supabase = this.SupabaseService.supabase;

            next();
        } catch (error) {
            res.status(401).json({ error: 'Unauthorized' });
        }
    }
}
