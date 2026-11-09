import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** "Remember this device" duration for a customer's QR-flow login — long-lived
 * on purpose, unlike the 2h staff-facing bill-share token, since this is the
 * guest's own login rather than a short-lived shared link. */
export const CUSTOMER_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

interface CustomerSessionClaims {
  // Namespaces this token against the other JWTs the same JWT_SECRET also
  // signs (staff sessions, bill-share links) — verifyToken below rejects
  // anything without it, so none of those can be replayed as each other.
  purpose: 'customer-session';
  customerId: string;
  branchId: string;
}

/**
 * Mints and checks the token behind a customer's self-service login on the
 * table-QR ordering flow (apps/web/app/order/[qrToken]). Stateless, like
 * BillShareService — no DB row, no logout endpoint needed; an expired or
 * tampered token just drops the guest back to the login/signup/guest gate.
 */
@Injectable()
export class CustomerAuthService {
  constructor(private readonly jwt: JwtService) {}

  issueToken(
    customerId: string,
    branchId: string,
    ttlSeconds: number = CUSTOMER_SESSION_TTL_SECONDS,
  ): string {
    const claims: CustomerSessionClaims = {
      purpose: 'customer-session',
      customerId,
      branchId,
    };
    return this.jwt.sign(claims, { expiresIn: ttlSeconds });
  }

  verifyToken(token: string): { customerId: string; branchId: string } {
    let claims: CustomerSessionClaims;
    try {
      claims = this.jwt.verify<CustomerSessionClaims>(token);
    } catch {
      throw new UnauthorizedException('Session expired, please log in again');
    }
    if (
      claims.purpose !== 'customer-session' ||
      !claims.customerId ||
      !claims.branchId
    ) {
      throw new UnauthorizedException('Session expired, please log in again');
    }
    return { customerId: claims.customerId, branchId: claims.branchId };
  }
}
