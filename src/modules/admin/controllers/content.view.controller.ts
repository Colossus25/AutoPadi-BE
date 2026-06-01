import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';

import { BannerService } from '@/modules/superadmin/service/banner.service';
import { ProductAttributeService } from '@/modules/superadmin/service/product-attribute.service';
import { ServiceAttributeService } from '@/modules/superadmin/service/service-attribute.service';
import { CloudinaryService } from '@/modules/global/cloudinary/cloudinary.service';
import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';

import { extractFlash, redirectWithFlash, errorMessage } from '../util/flash';

type AdminReq = Request & { user?: SuperAdmin };

const PRODUCT_ATTR_TYPES = ['make', 'type', 'year', 'colour', 'body', 'fuel'] as const;
const SERVICE_ATTR_TYPES = ['technician_categories', 'specialized_in', 'type_of_vehicles'] as const;

type ProductAttrType = (typeof PRODUCT_ATTR_TYPES)[number];
type ServiceAttrType = (typeof SERVICE_ATTR_TYPES)[number];

/**
 * Content & Ads section: banners, product attributes, service attributes.
 *
 * Three sibling tabs at /admin/content/{banners,product-attributes,service-attributes}.
 * Each tab is its own GET page so deep-linking works; CRUD POSTs redirect back
 * to the same tab, preserving the type filter where relevant.
 *
 * Banner images are uploaded multipart and pushed to Cloudinary; the returned
 * secure_url is what gets stored on Banner.image. If no new file is provided
 * on edit, the existing image is kept.
 */
@Controller('admin/content')
export class ContentViewController {
  constructor(
    private readonly banners: BannerService,
    private readonly productAttrs: ProductAttributeService,
    private readonly serviceAttrs: ServiceAttributeService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ---------- Default route -------------------------------------------

  @Get()
  index(@Res() res: Response) {
    return res.redirect('/admin/content/banners');
  }

  // ---------- Banners -------------------------------------------------

  @Get('banners')
  async banners_list(@Req() req: AdminReq, @Res() res: Response) {
    const items = await this.banners.getAllBanners();
    return res.render('admin/content/banners', {
      title: 'Content & Ads · Banners',
      active: 'content',
      tab: 'banners',
      admin: req.user,
      banners: items,
      flash: extractFlash(req),
    });
  }

  @Post('banners')
  @UseInterceptors(FileInterceptor('image'))
  async banners_create(
    @Body() body: { title?: string; description?: string },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AdminReq,
    @Res() res: Response,
  ) {
    try {
      const image = await this.uploadOrNull(file);
      await this.banners.createBanner(
        { title: body.title, description: body.description, image: image ?? undefined },
        req.user!,
      );
      return redirectWithFlash(res, '/admin/content/banners', 'success', 'Banner created.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/banners', 'error', errorMessage(e));
    }
  }

  @Post('banners/:id/update')
  @UseInterceptors(FileInterceptor('image'))
  async banners_update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; description?: string },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AdminReq,
    @Res() res: Response,
  ) {
    try {
      const existing = await this.banners.getBannerById(id);
      const image = (await this.uploadOrNull(file)) ?? existing.image;
      await this.banners.updateBanner(
        id,
        { title: body.title, description: body.description, image },
        req.user!,
      );
      return redirectWithFlash(res, '/admin/content/banners', 'success', 'Banner updated.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/banners', 'error', errorMessage(e));
    }
  }

  @Post('banners/:id/delete')
  async banners_delete(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.banners.deleteBanner(id);
      return redirectWithFlash(res, '/admin/content/banners', 'success', 'Banner deleted.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/banners', 'error', errorMessage(e));
    }
  }

  // ---------- Product attributes --------------------------------------

  @Get('product-attributes')
  async productAttrs_list(
    @Req() req: AdminReq,
    @Res() res: Response,
    @Query('type') type?: string,
  ) {
    const filter = isProductAttrType(type) ? type : null;
    const items = filter
      ? await this.productAttrs.getProductAttributesByType(filter)
      : await this.productAttrs.getAllProductAttributes();
    return res.render('admin/content/attributes', {
      title: 'Content & Ads · Product Attributes',
      active: 'content',
      tab: 'product-attributes',
      admin: req.user,
      items,
      typeFilter: filter,
      types: PRODUCT_ATTR_TYPES,
      formAction: '/admin/content/product-attributes',
      tabLabel: 'Product attribute',
      flash: extractFlash(req),
    });
  }

  @Post('product-attributes')
  async productAttrs_create(
    @Body() body: { attribute_type?: string; value?: string },
    @Req() req: AdminReq,
    @Res() res: Response,
  ) {
    try {
      const t = body.attribute_type;
      if (!isProductAttrType(t)) throw new BadRequestException('Invalid attribute type.');
      if (!body.value?.trim()) throw new BadRequestException('Value is required.');
      await this.productAttrs.createProductAttribute(
        { attribute_type: t, value: body.value.trim() },
        req.user!,
      );
      return redirectWithFlash(res, '/admin/content/product-attributes', 'success', 'Attribute added.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/product-attributes', 'error', errorMessage(e));
    }
  }

  @Post('product-attributes/:id/update')
  async productAttrs_update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { attribute_type?: string; value?: string },
    @Req() req: AdminReq,
    @Res() res: Response,
  ) {
    try {
      const t = body.attribute_type;
      if (!isProductAttrType(t)) throw new BadRequestException('Invalid attribute type.');
      if (!body.value?.trim()) throw new BadRequestException('Value is required.');
      await this.productAttrs.updateProductAttribute(
        id,
        { attribute_type: t, value: body.value.trim() },
        req.user!,
      );
      return redirectWithFlash(res, '/admin/content/product-attributes', 'success', 'Attribute updated.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/product-attributes', 'error', errorMessage(e));
    }
  }

  @Post('product-attributes/:id/delete')
  async productAttrs_delete(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.productAttrs.deleteProductAttribute(id);
      return redirectWithFlash(res, '/admin/content/product-attributes', 'success', 'Attribute deleted.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/product-attributes', 'error', errorMessage(e));
    }
  }

  // ---------- Service attributes --------------------------------------

  @Get('service-attributes')
  async serviceAttrs_list(
    @Req() req: AdminReq,
    @Res() res: Response,
    @Query('type') type?: string,
  ) {
    const filter = isServiceAttrType(type) ? type : null;
    const items = filter
      ? await this.serviceAttrs.getServiceAttributesByType(filter)
      : await this.serviceAttrs.getAllServiceAttributes();
    return res.render('admin/content/attributes', {
      title: 'Content & Ads · Service Attributes',
      active: 'content',
      tab: 'service-attributes',
      admin: req.user,
      items,
      typeFilter: filter,
      types: SERVICE_ATTR_TYPES,
      formAction: '/admin/content/service-attributes',
      tabLabel: 'Service attribute',
      flash: extractFlash(req),
    });
  }

  @Post('service-attributes')
  async serviceAttrs_create(
    @Body() body: { attribute_type?: string; value?: string },
    @Req() req: AdminReq,
    @Res() res: Response,
  ) {
    try {
      const t = body.attribute_type;
      if (!isServiceAttrType(t)) throw new BadRequestException('Invalid attribute type.');
      if (!body.value?.trim()) throw new BadRequestException('Value is required.');
      await this.serviceAttrs.createServiceAttribute(
        { attribute_type: t, value: body.value.trim() },
        req.user!,
      );
      return redirectWithFlash(res, '/admin/content/service-attributes', 'success', 'Attribute added.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/service-attributes', 'error', errorMessage(e));
    }
  }

  @Post('service-attributes/:id/update')
  async serviceAttrs_update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { attribute_type?: string; value?: string },
    @Req() req: AdminReq,
    @Res() res: Response,
  ) {
    try {
      const t = body.attribute_type;
      if (!isServiceAttrType(t)) throw new BadRequestException('Invalid attribute type.');
      if (!body.value?.trim()) throw new BadRequestException('Value is required.');
      await this.serviceAttrs.updateServiceAttribute(
        id,
        { attribute_type: t, value: body.value.trim() },
        req.user!,
      );
      return redirectWithFlash(res, '/admin/content/service-attributes', 'success', 'Attribute updated.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/service-attributes', 'error', errorMessage(e));
    }
  }

  @Post('service-attributes/:id/delete')
  async serviceAttrs_delete(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.serviceAttrs.deleteServiceAttribute(id);
      return redirectWithFlash(res, '/admin/content/service-attributes', 'success', 'Attribute deleted.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/content/service-attributes', 'error', errorMessage(e));
    }
  }

  // ---------- Helpers --------------------------------------------------

  private async uploadOrNull(file: Express.Multer.File | undefined): Promise<string | null> {
    if (!file) return null;
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Banner image must be an image file.');
    }
    const result = await this.cloudinary.upload([file]);
    const url = result?.[0]?.secure_url;
    if (!url) throw new BadRequestException('Image upload failed.');
    return url;
  }
}

// ---------- Module-private utilities ------------------------------------

function isProductAttrType(v: unknown): v is ProductAttrType {
  return typeof v === 'string' && (PRODUCT_ATTR_TYPES as readonly string[]).includes(v);
}
function isServiceAttrType(v: unknown): v is ServiceAttrType {
  return typeof v === 'string' && (SERVICE_ATTR_TYPES as readonly string[]).includes(v);
}

