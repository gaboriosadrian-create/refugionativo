export interface OnboardingStep1Data {
  name: string;
  businessName?: string;
  description: string;
  logo?: string;
  coverImage?: string;
  currency: string;
  timezone: string;
  language: string;
}

export interface OnboardingStep2Data {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  googleMapsUrl?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export interface OnboardingStep3Data {
  name: string;
  type: string;
  capacity: number;
  price: number;
  description: string;
  amenities: string[];
  image: string;
}

export interface OnboardingStep4Data {
  seasonName: string;
  basePrice: number;
  minStay: number;
  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface OnboardingStep5Data {
  title: string;
  subtitle: string;
  heroImage: string;
  ctaText: string;
}

export interface OnboardingProgress {
  id: string; // matches resortId
  resortId: string;
  currentStep: number; // 1 to 6
  completed: boolean;
  stepsSaved: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    step5: boolean;
    step6: boolean;
  };
  stepData: {
    step1?: OnboardingStep1Data;
    step2?: OnboardingStep2Data;
    step3?: OnboardingStep3Data;
    step4?: OnboardingStep4Data;
    step5?: OnboardingStep5Data;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
}
