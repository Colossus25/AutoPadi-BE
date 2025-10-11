import * as Joi from "joi"

export const createAdminValidation = Joi.object().keys({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().max(100).required(),
  password: Joi.string().min(6).max(32).required(),
  super_role_ids: Joi.array().items(Joi.number().integer()).optional(),
  super_group_ids: Joi.array().items(Joi.number().integer()).optional()
});

export const superLoginValidation = Joi.object().keys({
    email: Joi.string().email().max(50).required(),
    password: Joi.string().min(6).max(32).required()
})
