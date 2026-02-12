import * as Joi from 'joi';

export const createServiceValidation = Joi.object({
  name: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  media: Joi.array().items(Joi.string()).optional(),
  category: Joi.array().items(Joi.string()).allow(null).optional(),
  region: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  subscription_type: Joi.string().allow('', null).optional(),
  technician_categories: Joi.array().items(Joi.string()).allow(null).optional(),
  specialized_in: Joi.array().items(Joi.string()).allow(null).optional(),
  type_of_vehicles: Joi.array().items(Joi.string()).allow(null).optional(),
  service_location: Joi.string().allow('', null).optional(),
  pricing: Joi.string().allow('', null).optional(),
  specify_price_type: Joi.string().allow('', null).optional(),
  contact_person_name: Joi.string().allow('', null).optional(),
  contact_person_phone: Joi.string().allow('', null).optional(),
  location_coordinates: Joi.string().allow('', null).optional(),
  estimated_cost: Joi.number().allow(null).optional(),
  subscription_plan: Joi.string().allow('', null).optional(),
});
