import axios from 'axios';
import type { ResolvedDynamicAssetFields } from '../types';

const BASE = '/api/product-type-fields';

export const resolveProductTypeFields = (productTypeId: number | string): Promise<ResolvedDynamicAssetFields> =>
  axios.get(`${BASE}/resolve/${productTypeId}`).then((r) => r.data);
