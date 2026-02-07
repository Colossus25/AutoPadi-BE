import * as Joi from 'joi';
import { ConversationContextType, ConversationStatus } from '../entities';

export const createConversationValidation = Joi.object({
  other_user_id: Joi.number().required(),
  context_type: Joi.string()
    .valid(...Object.values(ConversationContextType))
    .optional(),
  context_id: Joi.string().uuid().allow(null).optional(),
});

export const updateConversationValidation = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ConversationStatus))
    .optional(),
});
