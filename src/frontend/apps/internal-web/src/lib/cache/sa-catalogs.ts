import { getServiceCatalog, ServiceTemplateOption } from '@/lib/api/work-order.api';
import { employeeApi, EmployeeData } from '@/lib/api/employees';
import { jobTypeApi, JobTypeData } from '@/lib/api/jobTypes';

const CATALOG_TTL_MS = 3 * 60 * 1000;

interface CacheEntry<T> {
  data: T | null;
  fetchedAt: number;
  inFlight: Promise<T> | null;
}

const serviceCatalogEntry: CacheEntry<ServiceTemplateOption[]> = {
  data: null,
  fetchedAt: 0,
  inFlight: null,
};

const techniciansEntry: CacheEntry<EmployeeData[]> = {
  data: null,
  fetchedAt: 0,
  inFlight: null,
};

const jobTypesEntry: CacheEntry<JobTypeData[]> = {
  data: null,
  fetchedAt: 0,
  inFlight: null,
};

async function getCached<T>(entry: CacheEntry<T>, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (entry.data !== null && now - entry.fetchedAt < CATALOG_TTL_MS) {
    return entry.data;
  }
  if (entry.inFlight) {
    return entry.inFlight;
  }
  entry.inFlight = fetcher()
    .then((result) => {
      entry.data = result;
      entry.fetchedAt = Date.now();
      return result;
    })
    .finally(() => {
      entry.inFlight = null;
    });
  return entry.inFlight;
}

export function getCachedServiceCatalog(): Promise<ServiceTemplateOption[]> {
  return getCached(serviceCatalogEntry, async () => {
    const res = await getServiceCatalog();
    return Array.isArray(res) ? res : [];
  });
}

export function getCachedActiveTechnicians(): Promise<EmployeeData[]> {
  return getCached(techniciansEntry, async () => {
    const res = await employeeApi.getAll({ limit: 100, position: 'TECHNICIAN', status: 'active' });
    return res.data || [];
  });
}

export function getCachedActiveJobTypes(): Promise<JobTypeData[]> {
  return getCached(jobTypesEntry, async () => {
    const res = await jobTypeApi.getAll({ limit: 100, isActive: true });
    return res.data || [];
  });
}
