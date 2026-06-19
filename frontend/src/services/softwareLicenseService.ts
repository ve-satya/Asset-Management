import axios from 'axios';
import type { SoftwareLicense } from '../types';

const BASE = (swId: number | string) => `/api/softwares/${swId}/licenses`;

export const getLicenses = (swId: number | string): Promise<SoftwareLicense[]> =>
  axios.get(BASE(swId)).then((r) => r.data);

export const getLicense = (swId: number | string, id: number | string): Promise<SoftwareLicense> =>
  axios.get(`${BASE(swId)}/${id}`).then((r) => r.data);

export const createLicense = (swId: number | string, data: unknown): Promise<SoftwareLicense> =>
  axios.post(BASE(swId), data).then((r) => r.data);

export const updateLicense = (swId: number | string, id: number | string, data: unknown): Promise<SoftwareLicense> =>
  axios.put(`${BASE(swId)}/${id}`, data).then((r) => r.data);

export const deleteLicense = (swId: number | string, id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE(swId)}/${id}`).then((r) => r.data);
