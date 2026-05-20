import * as Joi from "joi";

export const sendNotificationValidation = Joi.object({
  userIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  tag: Joi.string().min(1).max(100).required(),
  title: Joi.string().min(1).max(200).required(),
  body: Joi.string().min(1).max(1000).required(),
  data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});

export const broadcastNotificationValidation = Joi.object({
  userType: Joi.string()
    .valid("driver", "auto dealer", "service provider", "driver employer")
    .optional(),
  tag: Joi.string().min(1).max(100).required(),
  title: Joi.string().min(1).max(200).required(),
  body: Joi.string().min(1).max(1000).required(),
  data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});
