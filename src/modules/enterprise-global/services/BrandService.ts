import { Brand } from '../types';
import { organizationRepository } from '../repositories/organizationRepository';
import { complianceRepository } from '../repositories/complianceRepository';

export class BrandService {
  public static getBrandsByOrganization(orgId: string): Brand[] {
    return organizationRepository.getBrandsByOrg(orgId);
  }

  public static getAllBrands(): Brand[] {
    return organizationRepository.getAllBrands();
  }

  public static createBrand(brandData: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Brand {
    const newBrand = organizationRepository.createBrand(brandData);
    complianceRepository.logAudit({
      organizationId: brandData.organizationId,
      tenantId: 'tenant-default',
      actorEmail: 'system.admin@stayflow.com',
      actorRole: 'CORPORATE_ADMIN',
      action: 'CREATE_HOTEL_BRAND',
      category: 'config_change',
      targetResource: `brands/${newBrand.id}`,
      details: { name: newBrand.name, slug: newBrand.slug, brandColor: newBrand.brandColor },
      ipAddress: '127.0.0.1'
    });
    return newBrand;
  }
}
