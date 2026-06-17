import axios from 'axios';
import type { SoftwareSummary } from '../types';

export const getSoftwareSummary = (params?: Record<string, unknown>): Promise<SoftwareSummary> =>
  axios.get('/api/software-summary', { params }).then((r) => r.data);
