import * as Joi from 'joi';
import { ConversationReportReason } from '../entities';

export const reportConversationValidation = Joi.object({
  reason: Joi.string()
    .valid(...Object.values(ConversationReportReason))
    .required(),
  description: Joi.string().max(2000).optional().allow('', null),
  message_id: Joi.string().uuid().optional().allow(null),
});
