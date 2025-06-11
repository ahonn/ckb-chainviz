/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export const ZodParam = (paramName: string, schema: ZodSchema) =>
  createParamDecorator((_data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest();
    const paramValue: string = request.params[paramName];

    try {
      return schema.parse(paramValue);
    } catch (error) {
      const details = error instanceof ZodError ? error.issues : error;
      throw new BadRequestException({
        message: `Invalid parameter: ${paramName}`,
        details,
      });
    }
  })();
