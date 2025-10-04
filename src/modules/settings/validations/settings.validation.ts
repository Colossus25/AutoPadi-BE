import * as Joi from "joi";

export const EditPasswordValidation = Joi.object().keys({
  currentPassword: Joi.string().required().label("Current password"),
  newPassword: Joi.string().required().label("New password"),
});

export const EditProfilePictureValidation = Joi.object().keys({
  file: Joi.object().required().label("File"),
});

export const EditProfileValidation = Joi.object().keys({
  firstName: Joi.string().optional().allow("").label("First name"),
  lastName: Joi.string().optional().allow("").label("Last name"),
  email: Joi.string().email().optional().allow(null, "").label("Email address"),
  phone: Joi.string().optional().allow("").label("Phone number"),
  id_type: Joi.string().optional().allow("").label("ID Type"),
  id_number: Joi.string().optional().allow("").label("ID Number"),
  address: Joi.string().optional().allow("").label("Address"),
  landmark: Joi.string().optional().allow("").label("Landmark"),
  city: Joi.string().optional().allow("").label("City"),
  state: Joi.string().optional().allow("").label("State"),
  id_image: Joi.any().optional().label("ID image"),
  proof_of_address_image: Joi.any().optional().label("Proof of address image"),
});
