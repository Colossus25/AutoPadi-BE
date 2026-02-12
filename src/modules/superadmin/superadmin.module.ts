import { Module } from '@nestjs/common';
import { SuperadminService } from './service/auth.service';
import { SuperadminController } from './controllers/auth.controller';
import { SuperRoles } from './entities/super-role.entity';
import { SuperPermissions } from './entities/super-permissions.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdmin } from './entities/super-admin.entity';
import { SuperGroupService } from './service/group.service';
import { SuperGroup } from './entities/super-group.entity';
import { Banner } from './entities/banner.entity';
import { BannerService } from './service/banner.service';
import { BannerController } from './controllers/banner.controller';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeService } from './service/product-attribute.service';
import { ProductAttributeController } from './controllers/product-attribute.controller';
import { ServiceAttribute } from './entities/service-attribute.entity';
import { ServiceAttributeService } from './service/service-attribute.service';
import { ServiceAttributeController } from './controllers/service-attribute.controller';
import { ServiceApprovalController } from './controllers/service-approval.controller';
import { ServiceProviderModule } from '@/modules/serviceprovider/serviceprovider.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      SuperAdmin,
      SuperRoles,
      SuperPermissions,
      SuperGroup,
      Banner,
      ProductAttribute,
      ServiceAttribute,
    ]),
    ServiceProviderModule,
  ],
  providers: [SuperadminService, SuperGroupService, BannerService, ProductAttributeService, ServiceAttributeService],
  controllers: [SuperadminController, BannerController, ProductAttributeController, ServiceAttributeController, ServiceApprovalController],
  exports: [SuperadminService]
})
export class SuperadminModule {}
