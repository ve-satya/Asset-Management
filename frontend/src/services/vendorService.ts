import axios from 'axios';
import type { Vendor, PaginatedResponse, NamedOption } from '../types';

const BASE = '/api/vendors';

export const getVendors   = (params: Record<string, unknown>): Promise<PaginatedResponse<Vendor>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllVendors = (): Promise<NamedOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getVendor    = (id: number | string): Promise<Vendor> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createVendor = (data: unknown): Promise<Vendor> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateVendor = (id: number | string, data: unknown): Promise<Vendor> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteVendor = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
