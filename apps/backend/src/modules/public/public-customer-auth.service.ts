import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CustomerLoginDto,
  CustomerSignupDto,
} from '@nodedr-restaurant/types';
import * as bcrypt from 'bcrypt';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { PrismaService } from '../../prisma/prisma.service';

// bcrypt cost factor matching the staff login path (auth.service.ts).
const BCRYPT_ROUNDS = 12;

/**
 * Self-service signup/login for a guest on the table-QR ordering flow — a
 * Customer account scoped to the one branch the qrToken resolves to (same
 * per-branch scoping the CRM's Customer records already use for loyalty /
 * gift cards / addresses). Deliberately separate from staff auth
 * (auth.service.ts): a different identity, a differently-namespaced token
 * (CustomerAuthService), and no cookie — the frontend holds the token
 * itself, the way a guest "remembers" this device.
 */
@Injectable()
export class PublicCustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerAuth: CustomerAuthService,
  ) {}

  private async resolveBranchId(qrToken: string): Promise<string> {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: { floor: true },
    });
    if (!table) throw new NotFoundException('This QR code is not recognized');
    return table.floor.branchId;
  }

  /** `{email: identifier}` or `{phone: identifier}`, whichever the guest typed. */
  private identifierWhere(
    identifier: string,
  ): { email: string } | { phone: string } {
    return identifier.includes('@')
      ? { email: identifier }
      : { phone: identifier };
  }

  async signup(qrToken: string, dto: CustomerSignupDto) {
    const branchId = await this.resolveBranchId(qrToken);
    const identifierWhere = this.identifierWhere(dto.identifier);
    const existing = await this.prisma.customer.findFirst({
      where: { branchId, ...identifierWhere },
    });
    if (existing?.passwordHash) {
      throw new ConflictException(
        'An account already exists for that email/phone — please log in instead',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const customer = existing
      ? // A walk-in CRM record staff already created (no login) — attach the
        // new login to it instead of creating a duplicate, so loyalty
        // points/order history carry over.
        await this.prisma.customer.update({
          where: { id: existing.id },
          data: { name: dto.name, passwordHash },
        })
      : await this.prisma.customer.create({
          data: { branchId, name: dto.name, passwordHash, ...identifierWhere },
        });

    return this.issueSession(customer);
  }

  async login(qrToken: string, dto: CustomerLoginDto) {
    const branchId = await this.resolveBranchId(qrToken);
    const identifierWhere = this.identifierWhere(dto.identifier);
    const customer = await this.prisma.customer.findFirst({
      where: { branchId, ...identifierWhere, passwordHash: { not: null } },
    });
    if (
      !customer?.passwordHash ||
      !(await bcrypt.compare(dto.password, customer.passwordHash))
    ) {
      throw new UnauthorizedException('Incorrect email/phone or password');
    }
    return this.issueSession(customer);
  }

  async me(qrToken: string, token: string) {
    const branchId = await this.resolveBranchId(qrToken);
    const claims = this.customerAuth.verifyToken(token);
    if (claims.branchId !== branchId) {
      throw new UnauthorizedException('Session expired, please log in again');
    }
    const customer = await this.prisma.customer.findFirst({
      where: { id: claims.customerId, branchId },
    });
    if (!customer)
      throw new UnauthorizedException('Session expired, please log in again');
    return {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };
  }

  private issueSession(customer: {
    id: string;
    branchId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  }) {
    return {
      token: this.customerAuth.issueToken(customer.id, customer.branchId),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    };
  }
}
