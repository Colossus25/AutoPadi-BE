import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SuperadminModule } from '@/modules/superadmin/superadmin.module';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { ServiceProviderModule } from '@/modules/serviceprovider/serviceprovider.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { ConversationReport } from '@/modules/messaging/entities/conversation-report.entity';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';
import { SuperRoles } from '@/modules/superadmin/entities/super-role.entity';
import { SuperPermissions } from '@/modules/superadmin/entities/super-permissions.entity';
import { User } from '@/modules/auth/entities/user.entity';
import { Store } from '@/modules/autodealer/entities/store.entity';
import { Product } from '@/modules/autodealer/entities/product.entity';
import { Service } from '@/modules/serviceprovider/entities/service.entity';
import { Payment } from '@/modules/subscriptions/entities/payment.entity';
import { UserSubscription } from '@/modules/subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';
import { Logging } from '@/modules/logging/entities/logging.entity';

import { AuthViewController } from './controllers/auth.view.controller';
import { ContentViewController } from './controllers/content.view.controller';
import { DashboardViewController } from './controllers/dashboard.view.controller';
import { ListingsViewController } from './controllers/listings.view.controller';
import { CommunicationViewController } from './controllers/communication.view.controller';
import { SettingsViewController } from './controllers/settings.view.controller';
import { StoresViewController } from './controllers/stores.view.controller';
import { SubscriptionViewController } from './controllers/subscription.view.controller';
import { UsersViewController } from './controllers/users.view.controller';
import { AdminAuthMiddleware } from './middleware/admin-auth.middleware';
import { AdminCommunicationService } from './services/admin-communication.service';
import { AdminListingsService } from './services/admin-listings.service';
import { AdminOverviewService } from './services/admin-overview.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminStoresService } from './services/admin-stores.service';
import { AdminSubscriptionService } from './services/admin-subscription.service';
import { AdminUsersService } from './services/admin-users.service';

/**
 * Server-rendered admin dashboard (Pug + htmx + Alpine).
 *
 * View controllers stay thin: they inject either existing domain services
 * (e.g. SuperadminService, SubscriptionPlanService) or admin-specific read
 * services like AdminOverviewService / AdminSubscriptionService for queries
 * we don't want to add to the public API. Entities are registered here via
 * forFeature so the admin services can hit repos directly without dragging
 * in every domain module.
 *
 * AdminAuthMiddleware gates every protected controller; AuthViewController
 * (login/logout) is left open so visitors can actually reach the login form.
 */
@Module({
  imports: [
    SuperadminModule,
    SubscriptionsModule,
    ServiceProviderModule,
    AuthModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      User,
      Store,
      Product,
      Service,
      Payment,
      UserSubscription,
      SubscriptionPlan,
      Logging,
      ConversationReport,
      Notification,
      SuperAdmin,
      SuperRoles,
      SuperPermissions,
    ]),
  ],
  controllers: [
    AuthViewController,
    DashboardViewController,
    ContentViewController,
    SubscriptionViewController,
    ListingsViewController,
    UsersViewController,
    StoresViewController,
    CommunicationViewController,
    SettingsViewController,
  ],
  providers: [
    AdminOverviewService,
    AdminSubscriptionService,
    AdminListingsService,
    AdminUsersService,
    AdminStoresService,
    AdminCommunicationService,
    AdminSettingsService,
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AdminAuthMiddleware)
      .forRoutes(
        DashboardViewController,
        ContentViewController,
        SubscriptionViewController,
        ListingsViewController,
        UsersViewController,
        StoresViewController,
        CommunicationViewController,
        SettingsViewController,
      );
  }
}
