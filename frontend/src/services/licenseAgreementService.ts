import axios from 'axios';
import type { SoftwareLicenseAgreement, PaginatedResponse } from '../types';

const BASE = '/api/license-agreements';

export const getLicenseAgreements = (params: Record<string, unknown>): Promise<PaginatedResponse<SoftwareLicenseAgreement>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getLicenseAgreement = (id: number | string): Promise<SoftwareLicenseAgreement> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createLicenseAgreement = (data: unknown): Promise<SoftwareLicenseAgreement> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateLicenseAgreement = (id: number | string, data: unknown): Promise<SoftwareLicenseAgreement> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteLicenseAgreement = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
