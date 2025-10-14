import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus } from '@nestjs/common';
import { ProductService } from '../service/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createProductValidation } from '../validations/product.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Auto Dealer - Products')
@Controller('autodealer/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

    @Post()
    @UsePipes(new JoiValidationPipe(createProductValidation))
    async createProduct(@Body() dto: CreateProductDto, @Req() req: UserRequest, @Res() res: Response) {
        const product = await this.productService.createProduct(dto, req.user);
        return res.status(HttpStatus.CREATED).json({ success: true, data: product });
    }

    @Get()
    async getAllProducts(@Req() req: UserRequest, @Res() res: Response) {
        const products = await this.productService.getAllProducts(req.user);
        return res.status(HttpStatus.OK).json({ success: true, data: products });
    }

    @Get(':id')
    async getProduct(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
        const product = await this.productService.getProductById(id, req.user);
        return res.status(HttpStatus.OK).json({ success: true, data: product });
    }

    @Patch(':id')
    @UsePipes(new JoiValidationPipe(createProductValidation))
    async updateProduct(@Param('id') id: number, @Body() dto: CreateProductDto, 
    @Req() req: UserRequest,
    @Res() res: Response
    ) {
        const updatedProduct = await this.productService.updateProduct(id, dto, req.user);
        return res.status(HttpStatus.OK).json({
            success: true,
            data: updatedProduct,
        });
    }

    @Delete(':id')
    async deleteProduct(@Param('id') id: number, @Req() req: UserRequest,  @Res() res: Response) {
        const result = await this.productService.deleteProduct(id, req.user);
        return res.status(HttpStatus.OK).json({ success: true, ...result });
    }
}
