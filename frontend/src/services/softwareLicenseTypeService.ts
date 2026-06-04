import axios from 'axios';
import type { SoftwareLicenseType, PaginatedResponse, NamedOption } from '../types';

const BASE = '/api/software-license-types';

export const getSoftwareLicenseTypes   = (params: Record<string, unknown>): Promise<PaginatedResponse<SoftwareLicenseType>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllSoftwareLicenseTypes = (): Promise<NamedOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getSoftwareLicenseType    = (id: number | string): Promise<SoftwareLicenseType> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createSoftwareLicenseType = (data: unknown): Promise<SoftwareLicenseType> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateSoftwareLicenseType = (id: number | string, data: unknown): Promise<SoftwareLicenseType> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteSoftwareLicenseType = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
