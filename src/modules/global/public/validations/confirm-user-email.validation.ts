import * as Joi from 'joi';

export const ConfirmUserEmailValidation = Joi.object().keys({
  email: Joi.string().required(),
  token: Joi.string().required(),
});
