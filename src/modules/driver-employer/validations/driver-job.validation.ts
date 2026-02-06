import * as Joi from 'joi';

export const createDriverJobValidation = Joi.object({
  title: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  employing_type: Joi.string().allow('', null).optional(),
  number_of_driver_needed: Joi.number().integer().allow(null).optional(),
  driver_gender: Joi.string().allow('', null).optional(),
  driver_age: Joi.number().integer().allow(null).optional(),
  driver_level_of_education: Joi.string().allow('', null).optional(),
  driver_marital_status: Joi.string().allow('', null).optional(),
  religion: Joi.string().allow('', null).optional(),
  driver_years_of_experience: Joi.number().integer().allow(null).optional(),
  valid_driver_license: Joi.boolean().allow(null).optional(),
  driver_must_reside_in_state: Joi.boolean().allow(null).optional(),
  accomodation_available: Joi.boolean().allow(null).optional(),
  type_of_vehicles: Joi.array().items(Joi.string()).allow(null).optional(),
  subscription_plan: Joi.string().allow('', null).optional(),
});
