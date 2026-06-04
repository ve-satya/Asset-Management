import axios from 'axios';
import type { ProductType, ProductTypeOption, PaginatedResponse } from '../types';

const BASE = '/api/product-types';

export const getProductTypes = (params: Record<string, unknown>): Promise<PaginatedResponse<ProductType>> =>
  axios.get(BASE, { params }).then((r) => r.data);

export const getAllProductTypes = (): Promise<ProductTypeOption[]> =>
  axios.get(`${BASE}/all`).then((r) => r.data);

export const getProductType = (id: number | string): Promise<ProductType> =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createProductType = (data: unknown): Promise<ProductType> =>
  axios.post(BASE, data).then((r) => r.data);

export const updateProductType = (id: number | string, data: unknown): Promise<ProductType> =>
  axios.put(`${BASE}/${id}`, data).then((r) => r.data);

export const deleteProductType = (id: number | string): Promise<{ message: string }> =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);
