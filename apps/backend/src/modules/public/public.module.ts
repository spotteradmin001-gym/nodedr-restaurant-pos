import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../notifications/notifications.module';
import { BillShareModule } from '../bill-share/bill-share.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { OrdersModule } from '../orders/orders.module';
import { PublicBillController } from './public-bill.controller';
import { PublicBillService } from './public-bill.service';
import { PublicCustomerAuthController } from './public-customer-auth.controller';
import { PublicCustomerAuthService } from './public-customer-auth.service';
import { PublicKioskController } from './public-kiosk.controller';
import { PublicKioskService } from './public-kiosk.service';
import { PublicMenuController } from './public-menu.controller';
import { PublicMenuService } from './public-menu.service';

@Module({
  imports: [
    OrdersModule,
    NotificationsModule,
    BillShareModule,
    CustomerAuthModule,
  ],
  controllers: [
    PublicMenuController,
    PublicKioskController,
    PublicBillController,
    PublicCustomerAuthController,
  ],
  providers: [
    PublicMenuService,
    PublicKioskService,
    PublicBillService,
    PublicCustomerAuthService,
  ],
})
export class PublicModule {}
