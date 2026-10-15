import * as Joi from "joi";

export const updatePreferencesValidation = Joi.object({
  push_enabled: Joi.boolean().optional(),
  email_enabled: Joi.boolean().optional(),
  promotions_enabled: Joi.boolean().optional(),
}).min(1);
