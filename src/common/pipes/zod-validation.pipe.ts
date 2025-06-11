/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      const details = error instanceof ZodError ? error.issues : error;
      throw new BadRequestException({
        message: 'Validation failed',
        details,
      });
    }
  }
}
