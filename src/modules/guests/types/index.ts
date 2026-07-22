export interface Guest {
  id: string;
  resortId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  language: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  address: string;
  postalCode: string;
  notes: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type GuestSnapshot = Omit<Guest, 'id' | 'resortId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export * from './crm';
export * from './journey';
