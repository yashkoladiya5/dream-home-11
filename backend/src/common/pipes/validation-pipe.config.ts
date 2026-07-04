import {
  ValidationPipe,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors: ValidationError[]) => {
      const fields = errors.reduce<Record<string, string[]>>((acc, err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints)
          : [];
        if (constraints.length > 0) {
          acc[err.property] = constraints;
        }
        return acc;
      }, {});
      return new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        error: 'Bad Request',
        fields,
      });
    },
  });
}
