import axios from 'axios';
import type { SoftwareCategory, PaginatedResponse, NamedOption } from '../types';

const BASE = '/api/software-categories';

export const getSoftwareCategories   = (params: Record<string, unknown>): Promise<PaginatedResponse<SoftwareCategory>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllSoftwareCategories = (): Promise<NamedOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getSoftwareCategory     = (id: number | string): Promise<SoftwareCategory> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createSoftwareCategory  = (data: unknown): Promise<SoftwareCategory> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateSoftwareCategory  = (id: number | string, data: unknown): Promise<SoftwareCategory> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteSoftwareCategory  = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
