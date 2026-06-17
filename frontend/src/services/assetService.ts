import axios from 'axios';
import type { Asset, AssetHistoryItem, PaginatedResponse } from '../types';

const BASE = '/api/assets';

export const getAssets   = (params: Record<string, unknown>): Promise<PaginatedResponse<Asset>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAsset    = (id: number | string): Promise<Asset> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const getAssetHistory = (id: number | string, params: Record<string, unknown>): Promise<PaginatedResponse<AssetHistoryItem>> =>
  axios.get(`${BASE}/${id}/history`, { params }).then((r) => r.data);

export const createAsset = (data: unknown): Promise<Asset> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateAsset = (id: number | string, data: unknown): Promise<Asset> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteAsset = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
