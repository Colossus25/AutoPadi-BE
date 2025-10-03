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
  id_type: Joi.string()
    .valid("NIN", "NIS", "FRSC", "INEC")
    .optional()
    .messages({
      "any.only": "ID type must be one of nin, nis, frsc, or inec",
  }),
  id_number: Joi.string().optional(),
  address: Joi.string().optional().label("Address"),
  landmark: Joi.string().optional().label("Landmark"),
  city: Joi.string().optional().label("City"),
  state: Joi.string().optional().label("State"),
});
