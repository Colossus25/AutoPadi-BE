import * as Joi from 'joi';

export const createStoreValidation = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    image: Joi.string().optional(),
    category: Joi.string().optional(),
    address: Joi.string().optional(),
    subscription_type: Joi.string().optional(),
    registration_no: Joi.string().optional(),
    phone: Joi.string().optional(),
    email: Joi.string().optional(),
    website: Joi.string().optional(),
    contact_person_name: Joi.string().optional(),
    contact_person_phone: Joi.string().optional(),
    location_coordinates: Joi.string().optional(),
    subscription_plan: Joi.string().optional(),
});
