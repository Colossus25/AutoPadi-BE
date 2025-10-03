import * as Joi from "joi";

export const CreateAccountValidation = Joi.object().keys({
  email: Joi.string().email().required().label("Email"),
  password: Joi.string().min(6).max(50).required().messages({
    "string.pattern.base":
      "password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
  }),
  password_confirmation: Joi.string()
    .required()
    .valid(Joi.ref("password"))
    .messages({
      "any.only": "password does not match",
    })
    .label("Confirm password"),
});

export const UserTypeValidation = Joi.object({
  userType: Joi.string()
    .valid("buyer", "vendor", "service provider", "driver", "driver employer")
    .default("buyer") 
    .label("User type"),
});

export const ChangeUserPasswordValidation = Joi.object().keys({
  old_password: Joi.string().required().label("Old password"),
  new_password: Joi.string().min(6).max(50).required().messages({
    "string.pattern.base":
      "password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
  }),
  new_password_confirmation: Joi.string()
    .required()
    .valid(Joi.ref("new_password"))
    .messages({
      "any.only": "new password does not match",
    })
    .label("Confirm password"),
});

export const EditUserValidation = Joi.object().keys({
  first_name: Joi.string().optional().allow(null),
  last_name: Joi.string().optional().allow(null),
  address: Joi.string().optional().allow(null),
  phone: Joi.string().optional().allow(null),
});


export const LoginValidation = Joi.object().keys({
  email: Joi.string().email().max(50).required(),
  password: Joi.string().min(6).max(32).required(),
});

export const ResetPasswordValidation = Joi.object().keys({
  token: Joi.string().required(),
  password: Joi.string().min(6).max(32).required().messages({
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
  }),
  password_confirmation: Joi.any()
    .equal(Joi.ref("password"))
    .required()
    .label("Confirm password")
    .messages({ "any.only": "{{#label}} does not match" }),
});

export const ForgotPasswordValidation = Joi.object().keys({
  email: Joi.string().email().max(50).required(),
});
