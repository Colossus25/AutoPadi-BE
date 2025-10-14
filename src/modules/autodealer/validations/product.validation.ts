import * as Joi from 'joi';

export const createProductValidation = Joi.object({
  title: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  media: Joi.array().items(Joi.string()).optional(),
  location_coordinates: Joi.string().allow('', null).optional(),
  category: Joi.string().allow('', null).optional(),
  listing_type: Joi.string().allow('', null).optional(),
  price: Joi.string().allow('', null).optional(),
  make: Joi.string().allow('', null).optional(),
  year: Joi.string().allow('', null).optional(),
  type: Joi.string().allow('', null).optional(),
  condition: Joi.string().allow('', null).optional(),
  mileage: Joi.string().allow('', null).optional(),
  colour: Joi.string().allow('', null).optional(),
  body: Joi.string().allow('', null).optional(),
  fuel: Joi.string().allow('', null).optional(),
  store_id: Joi.number().integer().required(),
});
