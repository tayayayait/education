import { createApiClient } from '../services/apiClient';
import { ApiProblemsRepository, LocalProblemsRepository } from './repositories/problemsRepository';
import { ApiStandardsRepository, LocalStandardsRepository } from './repositories/standardsRepository';

const dataSource = (import.meta.env.VITE_DATA_SOURCE ?? 'local').toLowerCase();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

const apiClient = createApiClient({ baseUrl: apiBaseUrl });

export const standardsRepository =
  dataSource === 'api' ? new ApiStandardsRepository(apiClient) : new LocalStandardsRepository();

export const problemsRepository =
  dataSource === 'api' ? new ApiProblemsRepository(apiClient) : new LocalProblemsRepository();