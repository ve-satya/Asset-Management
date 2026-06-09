import axios from 'axios';
import type { SoftwareLicenseAgreement } from '../types';

const BASE = (swId: number | string) => `/api/softwares/${swId}/agreements`;

export const getAgreements = (swId: number | string): Promise<SoftwareLicenseAgreement[]> =>
  axios.get(BASE(swId)).then((r) => r.data);

export const createAgreement = (swId: number | string, data: unknown): Promise<SoftwareLicenseAgreement> =>
  axios.post(BASE(swId), data).then((r) => r.data);

export const updateAgreement = (swId: number | string, id: number | string, data: unknown): Promise<SoftwareLicenseAgreement> =>
  axios.put(`${BASE(swId)}/${id}`, data).then((r) => r.data);

export const deleteAgreement = (swId: number | string, id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE(swId)}/${id}`).then((r) => r.data);
