import { Problem } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { PROBLEMS } from '../constants';

export interface ProblemsRepository {
  list(): Promise<Problem[]>;
}

export class LocalProblemsRepository implements ProblemsRepository {
  async list() {
    return PROBLEMS;
  }
}

export class ApiProblemsRepository implements ProblemsRepository {
  constructor(private client: ApiClient) {}

  async list() {
    return this.client.get<Problem[]>('/problems');
  }
}