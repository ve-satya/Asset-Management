import axios from 'axios';
import type { SoftwareLicense, PaginatedResponse } from '../types';

const BASE = '/api/global-software-licenses';

export const getGlobalLicenses = (params: Record<string, unknown>): Promise<PaginatedResponse<SoftwareLicense>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getGlobalLicense = (id: number | string): Promise<SoftwareLicense> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createGlobalLicense = (data: unknown): Promise<SoftwareLicense> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateGlobalLicense = (id: number | string, data: unknown): Promise<SoftwareLicense> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const patchGlobalLicense = (id: number | string, data: Record<string, unknown>): Promise<SoftwareLicense> =>
  axios.patch(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteGlobalLicense = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
