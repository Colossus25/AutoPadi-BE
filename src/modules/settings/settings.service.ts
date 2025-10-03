import { UserRequest } from "@/definitions";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { User } from "../auth/entities/user.entity";
import { 
  EditPasswordDto, 
  EditProfileDto,
} from "./dto";
import { hashResource, verifyHash } from "@/core/utils/hashing"
import { MAILJETTemplates } from "@/constants";
import { CloudinaryService } from "@/modules/global/cloudinary/cloudinary.service";
import { first } from "rxjs";
import { SelectQueryBuilder, Brackets } from "typeorm";
import { paginate } from "@/core/helpers";
import { appConfig } from "@/config";

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,

  ) {}

  async getProfile(req: UserRequest) {
    const userId = req.user.id;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException("User not found.");
    }

    return { user };
  }

  async editProfile(
    editProfileDto: EditProfileDto,
    req: UserRequest,
    files?: { id_image?: Express.Multer.File[]; proof_of_address_image?: Express.Multer.File[] }
  ) {
    const { firstName, lastName, email, phone, id_type, id_number, address, landmark, city, state  } = editProfileDto;
    const userId = req.user.id;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found.");
    }

    user.first_name = firstName;
    user.last_name = lastName;
    user.email = email;
    user.phone = phone;
    user.id_type = id_type;
    user.id_number = id_number;
    user.address = address;
    user.landmark = landmark;
    user.city = city;
    user.state = state;

    if (files) {
      if (files.id_image?.[0]) {
        const upload = await this.cloudinaryService.upload([files.id_image[0]]);
        if (!upload?.[0]?.secure_url) throw new BadRequestException("Failed to upload ID image.");
        user.id_image = upload[0].secure_url;
      }

      if (files.proof_of_address_image?.[0]) {
        const upload = await this.cloudinaryService.upload([files.proof_of_address_image[0]]);
        if (!upload?.[0]?.secure_url) throw new BadRequestException("Failed to upload proof of address image.");
        user.proof_of_address_image = upload[0].secure_url;
      }
    }

    const data = await this.userRepository.save(user);

    return { message: "Profile updated successfully.", data };
  }

  async updatePassword(updatePasswordDto: EditPasswordDto, req: UserRequest) {
    const { currentPassword, newPassword } = updatePasswordDto;
    const { user } = req;

    console.log(user)

    const userEntity = await this.userRepository.findOne({ 
        where: { id: user.id }, 
        select: ["password"] 
    });
    
    if (!userEntity) {
        throw new BadRequestException("User not found.");
    }
    
    const isPasswordValid = await verifyHash(currentPassword, userEntity.password);
    if (!isPasswordValid) {
        throw new BadRequestException("Current password is incorrect.");
    }

    const hashedPassword = await hashResource(newPassword);

    await this.userRepository.update(user.id, { password: hashedPassword });

    return { message: "Password updated." };
  }

  async uploadProfilePicture(file: Express.Multer.File, req: UserRequest): Promise<{ message: string; url: string }> {
    const userId = req.user.id;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found.");
    }

    const uploadResult = await this.cloudinaryService.upload([file]);

    if (!uploadResult || !uploadResult[0]?.secure_url) {
      throw new BadRequestException("Failed to upload profile picture.");
    }

    user.profile_picture = uploadResult[0].secure_url;
    await this.userRepository.save(user);

    return { message: "Profile picture uploaded.", url: uploadResult[0].secure_url };
  }

  async deleteProfilePicture(req: UserRequest): Promise<{ message: string }> {
    const userId = req.user.id;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found.");
    }

    if (!user.profile_picture) {
      throw new BadRequestException("No profile picture to delete.");
    }

    const publicId = user.profile_picture.split("/").pop()?.split(".")[0];

    if (!publicId) {
      throw new BadRequestException("Invalid profile picture URL.");
    }

    await this.cloudinaryService.deleteImage(publicId);

    user.profile_picture = null;
    await this.userRepository.save(user);

    return { message: "Profile picture deleted." };
  }
}
