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


@Module({
  imports: [
    TypeOrmModule.forFeature([
      SuperAdmin,
      SuperRoles,
      SuperPermissions,
      SuperGroup,
      Banner,
    ])
  ],
  providers: [SuperadminService, SuperGroupService, BannerService],
  controllers: [SuperadminController, BannerController],
  exports: [SuperadminService]
})
export class SuperadminModule {}
