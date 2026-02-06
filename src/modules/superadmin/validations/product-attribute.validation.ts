import * as Joi from 'joi';

export const createProductAttributeValidation = Joi.object({
  attribute_type: Joi.string()
    .valid('make', 'type', 'year', 'colour', 'body', 'fuel')
    .required(),
  value: Joi.string().required(),
});
