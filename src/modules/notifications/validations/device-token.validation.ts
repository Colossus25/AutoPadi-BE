import * as Joi from "joi";

export const registerDeviceTokenValidation = Joi.object({
  token: Joi.string().min(1).max(4096).required(),
  platform: Joi.string().valid("android", "ios", "web").optional(),
});
