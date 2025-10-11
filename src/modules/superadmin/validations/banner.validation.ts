import * as Joi from 'joi';

export const createBannerValidation = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  image: Joi.string().optional(),
});
