import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logging } from "./entities/logging.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Logging
        ])
    ]
})
export class LoggingModule {}