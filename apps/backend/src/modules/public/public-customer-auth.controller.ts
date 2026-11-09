import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  customerLoginSchema,
  customerSignupSchema,
} from '@nodedr-restaurant/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PublicCustomerAuthService } from './public-customer-auth.service';

// Deliberately unauthenticated, like public-menu.controller.ts — this is the
// guest's own account on top of the table-QR flow, not a staff endpoint.
// Tightly throttled (tighter than the app-wide 300/min default) since
// signup/login are the two routes here an attacker could actually abuse
// (credential stuffing, account enumeration via signup).
@ApiTags('public')
@Controller('v1/public/menu/:qrToken/auth')
export class PublicCustomerAuthController {
  constructor(private readonly customerAuth: PublicCustomerAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('signup')
  @UsePipes(new ZodValidationPipe(customerSignupSchema))
  signup(@Param('qrToken') qrToken: string, @Body() body: unknown) {
    return this.customerAuth.signup(qrToken, body as never);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @UsePipes(new ZodValidationPipe(customerLoginSchema))
  login(@Param('qrToken') qrToken: string, @Body() body: unknown) {
    return this.customerAuth.login(qrToken, body as never);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('me')
  me(
    @Param('qrToken') qrToken: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    if (!token) throw new UnauthorizedException('No session token provided');
    return this.customerAuth.me(qrToken, token);
  }
}
