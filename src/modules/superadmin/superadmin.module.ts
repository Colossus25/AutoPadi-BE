import { Module } from '@nestjs/common';
import { SuperadminService } from './service/auth.service';
import { SuperadminController } from './controllers/auth.controller';
import { SuperRoles } from './entities/super-role.entity';
import { SuperPermissions } from './entities/super-permissions.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdmin } from './entities/super-admin.entity';
import { SuperGroupService } from './service/group.service';
import { SuperGroup } from './entities/super-group.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      SuperAdmin,
      SuperRoles,
      SuperPermissions,
      SuperGroup
    ])
  ],
  providers: [SuperadminService, SuperGroupService],
  controllers: [SuperadminController],
  exports: [SuperadminService]
})
export class SuperadminModule {}
