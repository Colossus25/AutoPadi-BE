import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

import { User } from "../auth/entities/user.entity"; 


import { CloudinaryService } from "@/modules/global/cloudinary/cloudinary.service"; 

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, CloudinaryService],
  exports: [SettingsService],
})
export class SettingsModule {}
