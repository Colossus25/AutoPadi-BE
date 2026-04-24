import * as Joi from 'joi';

export const sendMessageValidation = Joi.object({
  text: Joi.string().min(1).max(10000).optional().allow('', null),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().required(),
        url: Joi.string().uri().required(),
      }),
    )
    .optional(),
})
  .or('text', 'attachments')
  .messages({
    'object.missing': 'Message must contain either text or at least one attachment',
  });
