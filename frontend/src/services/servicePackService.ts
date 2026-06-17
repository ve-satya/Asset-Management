import axios from 'axios';
import type { ServicePack, PaginatedResponse } from '../types';

const BASE = '/api/service-packs';

export const getServicePacks = (params: Record<string, unknown>): Promise<PaginatedResponse<ServicePack>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const createServicePack = (data: unknown): Promise<ServicePack> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateServicePack = (id: number | string, data: unknown): Promise<ServicePack> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteServicePack = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
