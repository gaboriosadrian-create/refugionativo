export interface BookingRequestInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  policyAccepted: boolean;
}

export interface BookingRequestError {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  country?: string;
  policyAccepted?: string;
  general?: string;
}
