import * as Joi from 'joi';

export const createServiceAttributeValidation = Joi.object({
  attribute_type: Joi.string()
    .valid('technician_categories', 'specialized_in', 'type_of_vehicles')
    .required(),
  value: Joi.string().required(),
});
