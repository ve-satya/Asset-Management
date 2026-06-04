import axios from 'axios';
import type { Manufacturer, PaginatedResponse, NamedOption } from '../types';

const BASE = '/api/manufacturers';

export const getManufacturers   = (params: Record<string, unknown>): Promise<PaginatedResponse<Manufacturer>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllManufacturers = (): Promise<NamedOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getManufacturer    = (id: number | string): Promise<Manufacturer> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createManufacturer = (data: unknown): Promise<Manufacturer> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateManufacturer = (id: number | string, data: unknown): Promise<Manufacturer> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteManufacturer = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
