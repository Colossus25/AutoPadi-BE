import * as Joi from "joi"

export const superLoginValidation = Joi.object().keys({
    email: Joi.string().email().max(50).required(),
    password: Joi.string().min(6).max(32).required()
})