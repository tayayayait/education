import { AchievementStandard } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { STANDARDS } from '../constants';

export interface StandardsRepository {
  list(): Promise<AchievementStandard[]>;
}

export class LocalStandardsRepository implements StandardsRepository {
  async list() {
    return STANDARDS;
  }
}

export class ApiStandardsRepository implements StandardsRepository {
  constructor(private client: ApiClient) {}

  async list() {
    return this.client.get<AchievementStandard[]>('/standards');
  }
}