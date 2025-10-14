import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus } from '@nestjs/common';
import { StoreService } from '../service/store.service';
import { CreateStoreDto } from '../dto/create-store.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createStoreValidation } from '../validations/store.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Auto Dealer - Stores')
@Controller('autodealer/store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

    @Post()
    @UsePipes(new JoiValidationPipe(createStoreValidation))
    async createStore(@Body() dto: CreateStoreDto, @Req() req: UserRequest, @Res() res: Response) {
        const store = await this.storeService.createStore(dto, req.user);
        return res.status(HttpStatus.CREATED).json({ success: true, data: store });
    }

    @Get()
    async getAllStores(@Req() req: UserRequest, @Res() res: Response) {
        const stores = await this.storeService.getAllStores(req.user);
        return res.status(HttpStatus.OK).json({ success: true, data: stores });
    }

    @Get(':id')
    async getStore(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
        const store = await this.storeService.getStoreById(id, req.user);
        return res.status(HttpStatus.OK).json({ success: true, data: store });
    }

    @Patch(':id')
    @UsePipes(new JoiValidationPipe(createStoreValidation))
    async updateStore(@Param('id') id: number, @Body() dto: CreateStoreDto, 
    @Req() req: UserRequest,
    @Res() res: Response
    ) {
        const updatedStore = await this.storeService.updateStore(id, dto, req.user);
        return res.status(HttpStatus.OK).json({
            success: true,
            data: updatedStore,
        });
    }

    @Delete(':id')
    async deleteStore(@Param('id') id: number, @Req() req: UserRequest,  @Res() res: Response) {
        const result = await this.storeService.deleteStore(id, req.user);
        return res.status(HttpStatus.OK).json({ success: true, ...result });
    }
}
