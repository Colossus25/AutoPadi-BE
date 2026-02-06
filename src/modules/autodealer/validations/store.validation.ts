import * as Joi from 'joi';

export const createStoreValidation = Joi.object({
    name: Joi.string().allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    image: Joi.string().allow('', null).optional(),
    category: Joi.array().items(Joi.string()).allow(null).optional(),
    address: Joi.string().allow('', null).optional(),
    subscription_type: Joi.string().allow('', null).optional(),
    registration_no: Joi.string().allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    email: Joi.string().allow('', null).optional(),
    website: Joi.string().allow('', null).optional(),
    contact_person_name: Joi.string().allow('', null).optional(),
    contact_person_phone: Joi.string().allow('', null).optional(),
    location_coordinates: Joi.string().allow('', null).optional(),
    subscription_plan: Joi.string().allow('', null).optional(),
});
