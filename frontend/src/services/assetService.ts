import axios from 'axios';
import type { Asset, AssetAttachment, AssetContract, AssetFinancialsResponse, AssetHistoryItem, AssetRelationshipsResponse, PaginatedResponse } from '../types';

const BASE = '/api/assets';

export const getAssets   = (params: Record<string, unknown>): Promise<PaginatedResponse<Asset>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const exportAssets = (params: Record<string, unknown>) =>
  axios.get(`${BASE}/export`, { params, responseType: 'blob' });

export const getAsset    = (id: number | string): Promise<Asset> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const getAssetHistory = (id: number | string, params: Record<string, unknown>): Promise<PaginatedResponse<AssetHistoryItem>> =>
  axios.get(`${BASE}/${id}/history`, { params }).then((r) => r.data);

export const getAssetRelationships = (id: number | string): Promise<AssetRelationshipsResponse> =>
  axios.get(`${BASE}/${id}/relationships`).then((r) => r.data);

export const createAssetRelationship = (id: number | string, data: unknown): Promise<AssetRelationshipsResponse> =>
  axios.post(`${BASE}/${id}/relationships`, data).then((r) => r.data);

export const attachAssetRelationships = (id: number | string, data: unknown): Promise<AssetRelationshipsResponse> =>
  axios.post(`${BASE}/${id}/relationships/attach-assets`, data).then((r) => r.data);

export const deleteAssetRelationship = (id: number | string, relationshipId: number | string, relationshipType: string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}/relationships/${relationshipId}`, { params: { relationshipType } }).then((r) => r.data);

export const getAssetAttachments = (id: number | string): Promise<AssetAttachment[]> =>
  axios.get(`${BASE}/${id}/attachments`).then((r) => r.data);

export const uploadAssetAttachments = (id: number | string, files: File[]): Promise<AssetAttachment[]> => {
  const form = new FormData();
  files.forEach((file) => form.append('documents', file));
  return axios.post(`${BASE}/${id}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

export const downloadAssetAttachment = (id: number | string, attachmentId: number | string) =>
  axios.get(`${BASE}/${id}/attachments/${attachmentId}/download`, { responseType: 'blob' });

export const previewAssetAttachmentUrl = (id: number | string, attachmentId: number | string) =>
  `${BASE}/${id}/attachments/${attachmentId}/preview`;

export const deleteAssetAttachment = (id: number | string, attachmentId: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}/attachments/${attachmentId}`).then((r) => r.data);

export const getAssetContracts = (id: number | string, params: Record<string, unknown>): Promise<PaginatedResponse<AssetContract>> =>
  axios.get(`${BASE}/${id}/contracts`, { params }).then((r) => r.data);

export const createAssetContract = (id: number | string, data: unknown): Promise<AssetContract> =>
  axios.post(`${BASE}/${id}/contracts`, data).then((r) => r.data);

export const deleteAssetContract = (contractId: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/contracts/${contractId}`).then((r) => r.data);

export const getAssetCosts = (id: number | string): Promise<AssetFinancialsResponse> =>
  axios.get(`${BASE}/${id}/costs`).then((r) => r.data);

export const createAssetCost = (id: number | string, data: unknown): Promise<unknown> =>
  axios.post(`${BASE}/${id}/costs`, data).then((r) => r.data);

export const updateAssetCost = (costId: number | string, data: unknown): Promise<unknown> =>
  axios.put(`${BASE}/costs/${costId}`, data).then((r) => r.data);

export const deleteAssetCost = (costId: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/costs/${costId}`).then((r) => r.data);

export const createAsset = (data: unknown): Promise<Asset> =>
  axios.post(BASE, data).then((r) => r.data);

export const copyAsset = (id: number | string, data: unknown): Promise<Asset[]> =>
  axios.post(`${BASE}/${id}/copy`, data).then((r) => r.data);

export const updateAsset = (id: number | string, data: unknown): Promise<Asset> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const modifyAssetType = (id: number | string, data: unknown): Promise<Asset> =>
  axios.put(`${BASE}/${id}/modify-type`, data).then((r) => r.data);

export const deleteAsset = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
