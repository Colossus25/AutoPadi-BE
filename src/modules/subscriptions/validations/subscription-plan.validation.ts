import * as Joi from 'joi';

export const createSubscriptionPlanValidation = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Plan name is required',
    'string.min': 'Plan name must be at least 2 characters',
  }),
  amount: Joi.number().required().min(1000).messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be at least 1000 kobo (₦10)',
  }),
  billing_interval: Joi.string()
    .valid('monthly', 'yearly', 'quarterly')
    .required()
    .messages({
      'any.only': 'Billing interval must be monthly, yearly, or quarterly',
    }),
  free_trial_days: Joi.number().min(0).default(0).messages({
    'number.base': 'Free trial days must be a number',
    'number.min': 'Free trial days cannot be negative',
  }),
  description: Joi.string().max(500).optional().allow(null),
  features: Joi.array().items(Joi.string()).optional().allow(null),
  status: Joi.string().valid('active', 'inactive').default('active'),
});

export const updateSubscriptionPlanValidation = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Plan name must be at least 2 characters',
  }),
  amount: Joi.number().min(1000).optional().messages({
    'number.min': 'Amount must be at least 1000 kobo',
  }),
  billing_interval: Joi.string()
    .valid('monthly', 'yearly', 'quarterly')
    .optional(),
  free_trial_days: Joi.number().min(0).optional(),
  description: Joi.string().max(500).optional().allow(null),
  features: Joi.array().items(Joi.string()).optional().allow(null),
  status: Joi.string().valid('active', 'inactive').optional(),
});
