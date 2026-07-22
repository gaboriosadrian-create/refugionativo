export class AccommodationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccommodationValidationError extends AccommodationError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class AccommodationRepositoryError extends AccommodationError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message, 'REPOSITORY_ERROR');
  }
}

export class AccommodationNotFoundError extends AccommodationError {
  constructor(id: string | number) {
    super(`Accommodation with ID ${id} was not found`, 'NOT_FOUND');
  }
}
