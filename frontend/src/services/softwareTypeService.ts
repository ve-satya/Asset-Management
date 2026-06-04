import axios from 'axios';
import type { SoftwareType, PaginatedResponse, NamedOption } from '../types';

const BASE = '/api/software-types';

export const getSoftwareTypes   = (params: Record<string, unknown>): Promise<PaginatedResponse<SoftwareType>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllSoftwareTypes = (): Promise<NamedOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getSoftwareType    = (id: number | string): Promise<SoftwareType> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createSoftwareType = (data: unknown): Promise<SoftwareType> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateSoftwareType = (id: number | string, data: unknown): Promise<SoftwareType> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteSoftwareType = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
