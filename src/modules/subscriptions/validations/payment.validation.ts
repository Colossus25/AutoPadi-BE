import * as Joi from 'joi';

export const initiatePaymentValidation = Joi.object({
  subscription_plan_id: Joi.number().required().min(1).messages({
    'number.base': 'Subscription plan ID must be a number',
    'any.required': 'Subscription plan ID is required',
  }),
});

export const verifyPaymentValidation = Joi.object({
  reference: Joi.string().required().min(5).messages({
    'string.empty': 'Payment reference is required',
    'string.min': 'Invalid payment reference',
  }),
});

export const renewSubscriptionValidation = Joi.object({
  subscription_plan_id: Joi.number().required().min(1).messages({
    'number.base': 'Subscription plan ID must be a number',
    'any.required': 'Subscription plan ID is required',
  }),
});

export const initiateTrialValidation = Joi.object({
  subscription_plan_id: Joi.number().required().min(1).messages({
    'number.base': 'Subscription plan ID must be a number',
    'any.required': 'Subscription plan ID is required',
  }),
});
