import * as Joi from 'joi';

export const createDriverProfileValidation = Joi.object({
  name: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone_number: Joi.string().allow('', null).optional(),
  gender: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  level_of_education: Joi.string().allow('', null).optional(),
  tribe: Joi.string().allow('', null).optional(),
  age: Joi.number().integer().allow(null).optional(),
  marital_status: Joi.string().allow('', null).optional(),
  religion: Joi.string().allow('', null).optional(),
  years_of_experience: Joi.number().integer().allow(null).optional(),
  valid_driver_license: Joi.string().allow('', null).optional(),
  utility_bill: Joi.string().allow('', null).optional(),
  cv: Joi.string().allow('', null).optional(),
  open_to_relocation: Joi.boolean().allow(null).optional(),
  relocation_state: Joi.string().allow('', null).optional(),
  type_of_vehicles: Joi.array().items(Joi.string()).allow(null).optional(),
  subscription_plan: Joi.string().allow('', null).optional(),
});
