import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { createMockRepository, MockRepository } from './mock-repository.factory';

export function provideRepository(entity: EntityClassOrSchema): any {
  return {
    provide: getRepositoryToken(entity),
    useValue: createMockRepository(),
  };
}

export function provideRepositories(entities: EntityClassOrSchema[]): any[] {
  return entities.map(provideRepository);
}
