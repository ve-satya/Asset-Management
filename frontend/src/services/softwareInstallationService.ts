import axios from 'axios';
import type { SoftwareInstallation } from '../types';

const BASE = (swId: number | string) => `/api/softwares/${swId}/installations`;

export const getInstallations = (swId: number | string): Promise<SoftwareInstallation[]> =>
  axios.get(BASE(swId)).then((r) => r.data);

export const createInstallation = (swId: number | string, data: unknown): Promise<SoftwareInstallation> =>
  axios.post(BASE(swId), data).then((r) => r.data);

export const updateInstallation = (swId: number | string, id: number | string, data: unknown): Promise<SoftwareInstallation> =>
  axios.put(`${BASE(swId)}/${id}`, data).then((r) => r.data);

export const deleteInstallation = (swId: number | string, id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE(swId)}/${id}`).then((r) => r.data);
