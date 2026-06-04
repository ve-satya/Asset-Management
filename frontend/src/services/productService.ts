import axios from 'axios';
import type { Product, PaginatedResponse } from '../types';

const BASE = '/api/products';

export const getProducts   = (params: Record<string, unknown>): Promise<PaginatedResponse<Product>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllProducts = (): Promise<{ id: number; name: string; productTypeId: number }[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getProduct    = (id: number | string): Promise<Product> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createProduct = (data: unknown): Promise<Product> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateProduct = (id: number | string, data: unknown): Promise<Product> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);

export const uploadProductImage = (id: number | string, file: File): Promise<Product> => {
  const fd = new FormData();
  fd.append('image', file);
  return axios.post(`${BASE}/${id}/images`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const deleteProductImage = (id: number | string, filename: string): Promise<Product> =>
  axios.delete(`${BASE}/${id}/images/${encodeURIComponent(filename)}`).then((r) => r.data);
