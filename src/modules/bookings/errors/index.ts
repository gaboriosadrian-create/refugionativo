export class BookingError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BookingValidationError extends BookingError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 'BOOKING_VALIDATION_ERROR');
  }
}

export class BookingConflictError extends BookingError {
  constructor(message: string) {
    super(message, 'BOOKING_CONFLICT_ERROR');
  }
}

export class BookingAvailabilityError extends BookingError {
  constructor(message: string) {
    super(message, 'BOOKING_AVAILABILITY_ERROR');
  }
}

export class BookingCapacityError extends BookingError {
  constructor(message: string) {
    super(message, 'BOOKING_CAPACITY_ERROR');
  }
}
