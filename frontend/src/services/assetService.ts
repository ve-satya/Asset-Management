import axios from 'axios';
import type { Asset, AssetHistoryItem, AssetRelationshipsResponse, PaginatedResponse } from '../types';

const BASE = '/api/assets';

export const getAssets   = (params: Record<string, unknown>): Promise<PaginatedResponse<Asset>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAsset    = (id: number | string): Promise<Asset> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const getAssetHistory = (id: number | string, params: Record<string, unknown>): Promise<PaginatedResponse<AssetHistoryItem>> =>
  axios.get(`${BASE}/${id}/history`, { params }).then((r) => r.data);

export const getAssetRelationships = (id: number | string): Promise<AssetRelationshipsResponse> =>
  axios.get(`${BASE}/${id}/relationships`).then((r) => r.data);

export const createAssetRelationship = (id: number | string, data: unknown): Promise<AssetRelationshipsResponse> =>
  axios.post(`${BASE}/${id}/relationships`, data).then((r) => r.data);

export const deleteAssetRelationship = (id: number | string, relationshipId: number | string, relationshipType: string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}/relationships/${relationshipId}`, { params: { relationshipType } }).then((r) => r.data);

export const createAsset = (data: unknown): Promise<Asset> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateAsset = (id: number | string, data: unknown): Promise<Asset> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteAsset = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
