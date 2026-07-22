export interface CapacityTypeConfig {
  enabled: boolean;
  max: number;
  label: string;
}

export interface CapacityOptions {
  adults: CapacityTypeConfig;
  children: CapacityTypeConfig;
  babies: CapacityTypeConfig;
  pets: CapacityTypeConfig;
  maxGuestsLimit: number;
}

export interface StatusOption {
  id: 'available' | 'maintenance' | 'occupied' | 'inactive';
  label: string;
  color: string; // e.g. "green", "orange", "blue", "red" or tailwind classes
  active: boolean;
}

export interface CustomFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'decimal' | 'boolean' | 'date' | 'select' | 'checkbox' | 'textarea' | 'url' | 'email' | 'tel';
  required: boolean;
  visible: boolean;
  filterable: boolean;
  searchable: boolean;
  sortOrder: number;
  defaultValue?: any;
  options?: string[]; // options for "select" type
}

export interface AccommodationPolicies {
  checkInTime: string;
  checkInInstructions?: string;
  checkOutTime: string;
  checkOutInstructions?: string;
  petsAllowed: boolean;
  petsPolicy?: string;
  childrenAllowed: boolean;
  childrenPolicy?: string;
  smokingAllowed: boolean;
  cancellationPolicy: string;
  depositRequired: boolean;
  depositPolicy?: string;
  observations?: string;
}

export interface AccommodationType {
  id: string;
  displayName: string;
  icon: string;
  active: boolean;
  sortOrder: number;
  color?: string; // hex or tailwind class
  defaultAmenities: string[];
  customFields: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean';
  }[];
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  category?: string;
  description?: string;
  visible: boolean;
  sortOrder: number;
}

export interface AccommodationConfig {
  accommodationTypes: AccommodationType[];
  amenities: Amenity[];
  policies: AccommodationPolicies;
  customFields: CustomFieldConfig[];
  capacityOptions: CapacityOptions;
  statusOptions: StatusOption[];
}
