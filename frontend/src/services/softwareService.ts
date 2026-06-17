import axios from 'axios';
import type { Software, PaginatedResponse, NamedOption } from '../types';

const BASE = '/api/softwares';

export const getSoftwares = (params: Record<string, unknown>): Promise<PaginatedResponse<Software>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllSoftwares = (): Promise<NamedOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getSoftware = (id: number | string): Promise<Software> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createSoftware = (data: unknown): Promise<Software> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateSoftware = (id: number | string, data: unknown): Promise<Software> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const patchSoftware = (id: number | string, data: Record<string, unknown>): Promise<Software> =>
  axios.patch(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteSoftware = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);

export const uploadSoftwareImage = (id: number | string, file: File): Promise<Software> => {
  const form = new FormData();
  form.append('image', file);
  return axios.post(`${BASE}/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const deleteSoftwareImage = (id: number | string, filename: string): Promise<Software> =>
  axios.delete(`${BASE}/${id}/images/${filename}`).then((r) => r.data);
