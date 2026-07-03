import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ObjectSchema } from "joi";

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  //eslint-disable-next-line
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== "body") return value;
    if (value.content) value.content = JSON.parse(value.content);

    const { error } = this.schema.validate(value, { abortEarly: false });

    if (error) {
      const cause = error.details.map((detail) => ({
        name: detail.context?.key,
        message: detail.message.replace(/"/g, ""),
      }));
      // Surface the actual validation text as the top-level `message` (a plain
      // string the client can show directly), while keeping the per-field
      // breakdown in `errors`. Multiple failures are joined into one string.
      const message = cause.map((c) => c.message).join(", ");
      throw new UnprocessableEntityException(message, { cause });
    }
    return value;
  }
}
