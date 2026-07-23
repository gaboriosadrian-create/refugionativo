import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './modules/auth/contexts/AuthContext';
import { TenantProvider } from './core/tenant/TenantContext';
import { ResortProvider } from './shared/contexts/ResortContext';
import { SettingsProvider } from './modules/settings/contexts/SettingsContext';
import { AccommodationProvider } from './modules/accommodations/contexts/AccommodationContext';
import { MediaProvider } from './modules/media/contexts/MediaContext';
import { AccommodationConfigProvider } from './modules/accommodation-config';
import { AvailabilityProvider } from './modules/availability';
import { StayOperationsProvider } from './modules/stay-operations';
import { GuestProvider } from './modules/guests';
import { PricingProvider } from './modules/pricing/contexts/PricingContext';
import { WebsiteProvider } from './modules/public-portal';
import { SearchProvider } from './modules/public-search';
import { OnboardingProvider } from './modules/onboarding';
import { WebsiteCMSProvider } from './modules/website-cms/contexts/WebsiteCMSContext';
import { ThemeProvider } from './core/theme/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <ResortProvider>
          <SettingsProvider>
            <AccommodationProvider>
              <AccommodationConfigProvider>
                <AvailabilityProvider>
                  <MediaProvider>
                    <StayOperationsProvider>
                      <GuestProvider>
                        <PricingProvider>
                          <WebsiteProvider>
                            <SearchProvider>
                              <OnboardingProvider>
                                <WebsiteCMSProvider>
                                  <App />
                                </WebsiteCMSProvider>
                              </OnboardingProvider>
                            </SearchProvider>
                          </WebsiteProvider>
                        </PricingProvider>
                      </GuestProvider>
                    </StayOperationsProvider>
                  </MediaProvider>
                </AvailabilityProvider>
              </AccommodationConfigProvider>
            </AccommodationProvider>
          </SettingsProvider>
        </ResortProvider>
      </TenantProvider>
    </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
