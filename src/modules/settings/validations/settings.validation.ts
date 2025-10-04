import * as Joi from "joi";

export const EditPasswordValidation = Joi.object().keys({
  currentPassword: Joi.string().required().label("Current password"),
  newPassword: Joi.string().required().label("New password"),
});

export const EditProfilePictureValidation = Joi.object().keys({
  file: Joi.object().required().label("File"),
});

export const EditProfileValidation = Joi.object().keys({
  firstName: Joi.string().optional().label("First name"),
  lastName: Joi.string().optional().label("Last name"),
  email: Joi.string().email().optional().allow(null).label("Email address"),
  phone: Joi.string().optional().label("Phone number"),
  id_type: Joi.string().optional().label("ID Type"),
  id_number: Joi.string().optional().label("ID Number"),
  address: Joi.string().optional().label("Address"),
  landmark: Joi.string().optional().label("Landmark"),
  city: Joi.string().optional().label("City"),
  state: Joi.string().optional().label("State"),
});
