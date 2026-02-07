import * as Joi from 'joi';

export const sendMessageValidation = Joi.object({
  text: Joi.string().min(1).max(10000).required(),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().required(),
        url: Joi.string().uri().required(),
      }),
    )
    .optional(),
});
