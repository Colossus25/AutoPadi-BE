import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logging } from "../entities/logging.entity";
import { Repository } from "typeorm";





@Injectable()
export class LoggingService {
    constructor(
        @InjectRepository(Logging)
        private readonly loggingRepository: Repository<Logging>
    ) {}
}