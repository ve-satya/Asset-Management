import axios from 'axios';
import type { AssetState, PaginatedResponse, NamedOption } from '../types';

const BASE = '/api/asset-states';

export const getAssetStates   = (params: Record<string, unknown>): Promise<PaginatedResponse<AssetState>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllAssetStates = (): Promise<NamedOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getAssetState    = (id: number | string): Promise<AssetState> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createAssetState = (data: unknown): Promise<AssetState> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateAssetState = (id: number | string, data: unknown): Promise<AssetState> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteAssetState = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
