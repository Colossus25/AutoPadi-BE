import * as Joi from 'joi';

export const createBookingValidation = Joi.object({
  service_id: Joi.number().integer().required(),
  booking_date: Joi.date().required(),
  preferred_time: Joi.string().allow('', null).optional(),
  location: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  estimated_cost: Joi.number().allow(null).optional(),
});

export const updateBookingStatusValidation = Joi.object({
  status: Joi.string().valid('scheduled', 'completed', 'cancelled').required(),
  notes: Joi.string().allow('', null).optional(),
  final_cost: Joi.number().allow(null).optional(),
  declined_reason: Joi.string().allow('', null).optional(),
  cancelled_reason: Joi.string().allow('', null).optional(),
});

export const createReviewValidation = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().required(),
});

export const createReportValidation = Joi.object({
  reason: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
});
