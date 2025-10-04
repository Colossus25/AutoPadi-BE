import { appConfig } from '@/config';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { extractDataFromCookie } from '@/core/utils';
import { CanActivate, ExecutionContext, Injectable, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    let token: string = '';
    let user: any;

    try {
      // 1️⃣ Check Authorization header first
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      // 2️⃣ Otherwise, fall back to cookie
      if (!token) {
        const cookieData = req.cookies[_AUTH_COOKIE_NAME_];
        if (!cookieData) throw new UnauthorizedException('You are unauthenticated');
        const parsed = JSON.parse(decodeURIComponent(cookieData));
        token = parsed.token;
        user = parsed.user;
      }

      // 3️⃣ Verify the token
      const payload = await this.jwtService.verifyAsync(token, { secret: appConfig.JWT_SECRET });

      // 4️⃣ Attach payload + user info to request
      req.user = user || payload;
      return true;
    } catch (err) {
      res.clearCookie(_AUTH_COOKIE_NAME_);
      throw new UnauthorizedException('Your session has expired or token is invalid');
    }
  }
}
