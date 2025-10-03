import { _AUTH_COOKIE_NAME_ } from "@/constants";
import { successResponse } from "@/core/utils";
import { UserRequest } from "@/definitions";
import { AuthGuard } from "@/guards";
import { JoiValidationPipe } from "@/pipes/joi.validation.pipe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  UploadedFile,
  UseInterceptors,
  UploadedFiles
} from "@nestjs/common";
import { ApiCookieAuth, ApiQuery, ApiTags, ApiBody, ApiConsumes } from "@nestjs/swagger";
import type { Response } from "express";
import { FileInterceptor, FileFieldsInterceptor } from "@nestjs/platform-express";
import { SettingsService } from "./settings.service";
import { 
    EditPasswordValidation, 
    EditProfileValidation,
} from "./validations/settings.validation";
import { 
    EditPasswordDto, 
    EditProfileDto,
} from "./dto";


@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags("Settings")
@Controller("settings")
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @UsePipes()
    @Get("get-profile")
    async getProfile(
        @Req() req: UserRequest,
        @Res() res: Response,
    ) {
    const data = await this.settingsService.getProfile(req);
        successResponse(res, { data });
    }

    @Patch("edit-profile")
    @UseInterceptors(
    FileFieldsInterceptor([
        { name: "id_image", maxCount: 1 },
        { name: "proof_of_address_image", maxCount: 1 }
    ])
    )
    @ApiConsumes("multipart/form-data")
    async editProfile(
    @Req() req: UserRequest,
    @Res() res: Response,
    @Body(new JoiValidationPipe(EditProfileValidation)) editProfileDto: EditProfileDto,
    @UploadedFiles() files: { id_image?: Express.Multer.File[]; proof_of_address_image?: Express.Multer.File[] }
    ) {
    const {message, data} = await this.settingsService.editProfile(editProfileDto, req, files);
    successResponse(res, { message, data });
    }

    @UsePipes(new JoiValidationPipe(EditPasswordValidation))
    @Patch("edit-password")
    async updatePassword(
        @Req() req: UserRequest,
        @Res() res: Response,
        @Body() updatePasswordDto: EditPasswordDto,
    ) {
        const data = await this.settingsService.updatePassword(updatePasswordDto, req);
        successResponse(res, { data });
    }
    
    
    @Patch("upload-profile-picture")
    @UseInterceptors(FileInterceptor("file"))
    @ApiConsumes("multipart/form-data")
    @ApiBody({
    schema: {
        type: "object",
        properties: {
        file: {
            type: "string",
            format: "binary",
        },
        },
    },
    })
    async uploadProfilePicture(
    @Req() req: UserRequest,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    ) {
    const data = await this.settingsService.uploadProfilePicture(file, req);
    successResponse(res, { data });
    }

    @Delete("delete-profile-picture")
    async deleteProfilePicture(
    @Req() req: UserRequest,
    @Res() res: Response,
    ) {
    const data = await this.settingsService.deleteProfilePicture(req);
    successResponse(res, { data });
    }
}