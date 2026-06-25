import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

type OpenApiObject = Record<string, unknown>;

const jsonContent = { 'application/json': { schema: { type: 'object', additionalProperties: true } } };
const multipartContent = { 'multipart/form-data': { schema: { type: 'object', additionalProperties: true } } };

const idParam = (name = 'id', description = 'Record id') => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', example: 1 },
});

const assetIdParam = idParam('assetId', 'Asset id');

const softwareIdParam = {
  name: 'softwareId',
  in: 'path',
  required: true,
  description: 'Software id',
  schema: { type: 'integer', example: 1 },
};

const pagingParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
  { name: 'pageSize', in: 'query', schema: { type: 'integer', example: 25 } },
  { name: 'search', in: 'query', schema: { type: 'string', example: 'access' } },
  { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'name' } },
  { name: 'sortDirection', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], example: 'asc' } },
];

const responses = {
  ok: { description: 'Success' },
  created: { description: 'Created' },
  deleted: { description: 'Deleted' },
  badRequest: { description: 'Invalid request', content: jsonContent },
  notFound: { description: 'Not found', content: jsonContent },
};

const bearerSecurity = [{ bearerAuth: [] }];

const singularLabels: Record<string, string> = {
  'Product Types': 'product type',
  'Product Type Fields': 'product type field',
  Products: 'product',
  Vendors: 'vendor',
  'Asset States': 'asset state',
  Manufacturers: 'manufacturer',
  'Software Types': 'software type',
  'Software Categories': 'software category',
  'Software License Types': 'software license type',
  Software: 'software',
  'License Agreements': 'license agreement',
  'Global Software Licenses': 'global software license',
  'Service Packs': 'service pack',
};

const pluralLabels: Record<string, string> = {
  'Product Types': 'product types',
  'Product Type Fields': 'product type fields',
  Products: 'products',
  Vendors: 'vendors',
  'Asset States': 'asset states',
  Manufacturers: 'manufacturers',
  'Software Types': 'software types',
  'Software Categories': 'software categories',
  'Software License Types': 'software license types',
  Software: 'software',
  'License Agreements': 'license agreements',
  'Global Software Licenses': 'global software licenses',
  'Service Packs': 'service packs',
};

function labelFor(tag: string) {
  return singularLabels[tag] || tag.toLowerCase();
}

function pluralLabelFor(tag: string) {
  return pluralLabels[tag] || `${labelFor(tag)}s`;
}

function listOperation(tag: string, summary: string, extraParams: OpenApiObject[] = []) {
  return {
    tags: [tag],
    summary,
    security: bearerSecurity,
    parameters: [...pagingParams, ...extraParams],
    responses: { 200: responses.ok },
  };
}

function getOperation(tag: string, summary: string, params: OpenApiObject[] = [idParam()]) {
  return {
    tags: [tag],
    summary,
    security: bearerSecurity,
    parameters: params,
    responses: { 200: responses.ok, 404: responses.notFound },
  };
}

function createOperation(tag: string, summary: string, example: OpenApiObject, params: OpenApiObject[] = []) {
  return {
    tags: [tag],
    summary,
    security: bearerSecurity,
    parameters: params,
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { type: 'object' }, example } },
    },
    responses: { 201: responses.created, 400: responses.badRequest },
  };
}

function updateOperation(tag: string, summary: string, example: OpenApiObject, params: OpenApiObject[] = [idParam()]) {
  return {
    tags: [tag],
    summary,
    security: bearerSecurity,
    parameters: params,
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { type: 'object' }, example } },
    },
    responses: { 200: responses.ok, 400: responses.badRequest, 404: responses.notFound },
  };
}

function deleteOperation(tag: string, summary: string, params: OpenApiObject[] = [idParam()]) {
  return {
    tags: [tag],
    summary,
    security: bearerSecurity,
    parameters: params,
    responses: { 200: responses.deleted, 404: responses.notFound },
  };
}

function crudPaths(base: string, tag: string, example: OpenApiObject, allPath = true) {
  const label = labelFor(tag);
  const pluralLabel = pluralLabelFor(tag);
  return {
    ...(allPath ? {
      [`${base}/all`]: {
        get: {
          tags: [tag],
          summary: `List ${label} options (legacy /all endpoint)`,
          deprecated: true,
          security: bearerSecurity,
          responses: { 200: responses.ok },
        },
      },
      [`${base}/options`]: {
        get: {
          tags: [tag],
          summary: `List ${label} options`,
          security: bearerSecurity,
          responses: { 200: responses.ok },
        },
      },
    } : {}),
    [base]: {
      get: listOperation(tag, `List ${pluralLabel}`),
      post: createOperation(tag, `Create ${label}`, example),
    },
    [`${base}/{id}`]: {
      get: getOperation(tag, `Get ${label}`),
      put: updateOperation(tag, `Update ${label}`, example),
      delete: deleteOperation(tag, `Delete ${label}`),
    },
  };
}

const productTypeExample = {
  displayName: 'Access Point',
  displayPluralName: 'Access Points',
  apiName: 'access-point',
  apiPluralName: 'access-points',
  category: 'Asset',
  assetType: 'Asset',
  assetCategory: 'IT',
  parentId: null,
  description: 'Network access points',
};

const productExample = {
  name: 'PoE',
  productTypeId: 1,
  manufacturerId: 1,
  description: 'Power over Ethernet access point',
};

const vendorExample = {
  name: 'TENDaa',
  currency: 'USD',
  contactPerson: 'Jane Doe',
  email: 'vendor@example.com',
  phone: '555-0100',
  country: 'United States',
};

const assetExample = {
  productTypeId: 1,
  name: 'Access Point - A3',
  productId: 1,
  product: 'PoE',
  assetState: 'In Store',
  purchaseCost: 50000,
  isLoanable: false,
};

const softwareExample = {
  name: 'Windows 11',
  version: '23H2',
  softwareTypeId: 1,
  softwareCategoryId: 1,
  manufacturerId: 1,
  description: 'Operating system',
};

const licenseExample = {
  licenseKey: 'XXXX-YYYY-ZZZZ',
  licenseName: 'Enterprise license',
  seats: 50,
  expiryDate: '2027-12-31',
};

const agreementExample = {
  name: 'Microsoft EA',
  agreementNumber: 'AGR-1001',
  authorizationNumber: 'AUTH-1001',
  startDate: '2026-01-01',
  endDate: '2027-01-01',
};

const paths: OpenApiObject = {
  '/': {
    get: {
      tags: ['System'],
      summary: 'API root',
      responses: { 200: responses.ok },
    },
  },
  '/api/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      responses: { 200: responses.ok },
    },
  },

  ...crudPaths('/api/product-types', 'Product Types', productTypeExample),
  '/api/product-types/{productTypeId}/fields': {
    get: getOperation('Product Type Fields', 'List product type fields including inherited fields', [idParam('productTypeId', 'Product type id')]),
  },
  '/api/product-type-fields/resolve/{productTypeId}': {
    get: {
      ...getOperation('Product Type Fields', 'List product type fields including inherited fields (legacy endpoint)', [idParam('productTypeId', 'Product type id')]),
      deprecated: true,
    },
  },
  ...crudPaths('/api/product-type-fields', 'Product Type Fields', {
    productTypeId: 1,
    fieldName: 'Service Tag',
    fieldKey: 'serviceTag',
    fieldType: 'text',
    sectionName: 'Computer Details',
    isRequired: false,
  }, false),
  ...crudPaths('/api/products', 'Products', productExample),
  '/api/products/{id}/images': {
    post: {
      tags: ['Products'],
      summary: 'Upload product image',
      security: bearerSecurity,
      parameters: [idParam()],
      requestBody: { required: true, content: multipartContent },
      responses: { 200: responses.ok, 400: responses.badRequest },
    },
  },
  '/api/products/{id}/images/{filename}': {
    delete: deleteOperation('Products', 'Delete product image', [idParam(), { name: 'filename', in: 'path', required: true, schema: { type: 'string' } }]),
  },
  ...crudPaths('/api/vendors', 'Vendors', vendorExample),
  ...crudPaths('/api/asset-states', 'Asset States', { name: 'In Store', description: 'Stored asset state' }),
  ...crudPaths('/api/manufacturers', 'Manufacturers', { name: 'Microsoft', description: 'Software manufacturer' }),

  '/api/assets': {
    get: {
      ...listOperation('Assets', 'List assets', [
        { name: 'productTypeId', in: 'query', schema: { type: 'integer', example: 1 } },
        { name: 'assetState', in: 'query', schema: { type: 'string', example: 'In Store' } },
        { name: 'assetView', in: 'query', schema: { type: 'string', enum: ['disposed', 'loaned', 'unassigned'] } },
        { name: 'product', in: 'query', schema: { type: 'string', example: 'PoE' } },
      ]),
    },
    post: createOperation('Assets', 'Create asset', assetExample),
  },
  '/api/assets/{id}': {
    get: getOperation('Assets', 'Get asset details'),
    put: updateOperation('Assets', 'Update asset', assetExample),
    delete: deleteOperation('Assets', 'Delete asset'),
  },
  '/api/assets/{assetId}/history': {
    get: listOperation('Asset History', 'List asset history', [assetIdParam, { name: 'type', in: 'query', schema: { type: 'string', enum: ['asset', 'ownership'] } }]),
  },
  '/api/assets/{assetId}/relationships': {
    get: getOperation('Asset Relationships', 'Get asset relationships', [assetIdParam]),
    post: createOperation('Asset Relationships', 'Create asset relationship', {
      relationshipType: 'ConnectedAsset',
      relatedAssetId: 2,
    }, [assetIdParam]),
  },
  '/api/assets/{assetId}/relationships/{relationshipId}': {
    delete: deleteOperation('Asset Relationships', 'Delete asset relationship', [
      assetIdParam,
      idParam('relationshipId', 'Relationship id'),
      { name: 'relationshipType', in: 'query', schema: { type: 'string', example: 'ConnectedAsset' } },
    ]),
  },
  '/api/assets/{assetId}/contracts': {
    get: listOperation('Asset Contracts', 'List asset contracts', [assetIdParam]),
    post: createOperation('Asset Contracts', 'Create asset contract', {
      contractId: 'C-1001',
      contractName: 'Annual Maintenance',
      maintenanceVendor: 'Acme Support',
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
    }, [assetIdParam]),
  },
  '/api/assets/{assetId}/contracts/{contractId}': {
    delete: deleteOperation('Asset Contracts', 'Delete asset contract', [assetIdParam, idParam('contractId', 'Contract id')]),
  },
  '/api/assets/contracts/{contractId}': {
    delete: {
      ...deleteOperation('Asset Contracts', 'Delete asset contract (legacy endpoint)', [idParam('contractId', 'Contract id')]),
      deprecated: true,
    },
  },
  '/api/assets/{assetId}/costs': {
    get: getOperation('Asset Financials', 'Get asset costs and financial summary', [assetIdParam]),
    post: createOperation('Asset Financials', 'Create asset cost', {
      costFactor: 'Service Cost',
      costAmount: 455,
      description: 'Service visit',
      costDate: '2026-06-24',
    }, [assetIdParam]),
  },
  '/api/assets/{assetId}/costs/{costId}': {
    put: updateOperation('Asset Financials', 'Update asset cost', {
      costFactor: 'Move/Change Cost',
      costAmount: 555,
      description: 'Moved to another site',
      costDate: '2026-06-24',
    }, [assetIdParam, idParam('costId', 'Cost id')]),
    delete: deleteOperation('Asset Financials', 'Delete asset cost', [assetIdParam, idParam('costId', 'Cost id')]),
  },
  '/api/assets/costs/{costId}': {
    put: {
      ...updateOperation('Asset Financials', 'Update asset cost (legacy endpoint)', {
      costFactor: 'Move/Change Cost',
      costAmount: 555,
      description: 'Moved to another site',
      costDate: '2026-06-24',
      }, [idParam('costId', 'Cost id')]),
      deprecated: true,
    },
    delete: {
      ...deleteOperation('Asset Financials', 'Delete asset cost (legacy endpoint)', [idParam('costId', 'Cost id')]),
      deprecated: true,
    },
  },

  ...crudPaths('/api/software-types', 'Software Types', { name: 'Operating System', description: 'OS software type' }),
  ...crudPaths('/api/software-categories', 'Software Categories', { name: 'Commercial', description: 'Commercial software category' }),
  ...crudPaths('/api/software-license-types', 'Software License Types', { name: 'Per User', description: 'Per-user license' }),
  ...crudPaths('/api/softwares', 'Software', softwareExample),
  '/api/softwares/{id}/images': {
    post: {
      tags: ['Software'],
      summary: 'Upload software image',
      security: bearerSecurity,
      parameters: [idParam()],
      requestBody: { required: true, content: multipartContent },
      responses: { 200: responses.ok, 400: responses.badRequest },
    },
  },
  '/api/softwares/{id}/images/{filename}': {
    delete: deleteOperation('Software', 'Delete software image', [idParam(), { name: 'filename', in: 'path', required: true, schema: { type: 'string' } }]),
  },
  '/api/softwares/{softwareId}/licenses': {
    get: listOperation('Software Licenses', 'List software licenses', [softwareIdParam]),
    post: createOperation('Software Licenses', 'Create software license', licenseExample, [softwareIdParam]),
  },
  '/api/softwares/{softwareId}/licenses/{id}': {
    get: getOperation('Software Licenses', 'Get software license', [softwareIdParam, idParam()]),
    put: updateOperation('Software Licenses', 'Update software license', licenseExample, [softwareIdParam, idParam()]),
    delete: deleteOperation('Software Licenses', 'Delete software license', [softwareIdParam, idParam()]),
  },
  '/api/softwares/{softwareId}/installations': {
    get: listOperation('Software Installations', 'List software installations', [softwareIdParam]),
    post: createOperation('Software Installations', 'Create software installation', { assetId: 1, userName: 'administrator', installedOn: '2026-06-24' }, [softwareIdParam]),
  },
  '/api/softwares/{softwareId}/installations/{id}': {
    get: getOperation('Software Installations', 'Get software installation', [softwareIdParam, idParam()]),
    put: updateOperation('Software Installations', 'Update software installation', { assetId: 1, userName: 'administrator' }, [softwareIdParam, idParam()]),
    delete: deleteOperation('Software Installations', 'Delete software installation', [softwareIdParam, idParam()]),
  },
  '/api/softwares/{softwareId}/agreements': {
    get: listOperation('Software License Agreements', 'List software-linked agreements', [softwareIdParam]),
    post: createOperation('Software License Agreements', 'Create software-linked agreement', agreementExample, [softwareIdParam]),
  },
  '/api/softwares/{softwareId}/agreements/{id}': {
    put: updateOperation('Software License Agreements', 'Update software-linked agreement', agreementExample, [softwareIdParam, idParam()]),
    delete: deleteOperation('Software License Agreements', 'Delete software-linked agreement', [softwareIdParam, idParam()]),
  },
  ...crudPaths('/api/license-agreements', 'License Agreements', agreementExample, false),
  ...crudPaths('/api/global-software-licenses', 'Global Software Licenses', licenseExample, false),
  '/api/global-software-licenses/{id}': {
    get: getOperation('Global Software Licenses', 'Get global software license'),
    put: updateOperation('Global Software Licenses', 'Update global software license', licenseExample),
    patch: updateOperation('Global Software Licenses', 'Patch global software license', { licenseName: 'Updated license' }),
    delete: deleteOperation('Global Software Licenses', 'Delete global software license'),
  },
  ...crudPaths('/api/service-packs', 'Service Packs', { name: 'SP1', version: '1.0', description: 'Service pack' }, false),
  '/api/software-summary': {
    get: {
      tags: ['Software Summary'],
      summary: 'Get software dashboard summary',
      security: bearerSecurity,
      responses: { 200: responses.ok },
    },
  },
};

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Asset Management API',
      version: '1.0.0',
      description: 'Interactive API documentation for the Asset Management backend.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local development server',
      },
    ],
    tags: [
      { name: 'System' },
      { name: 'Assets' },
      { name: 'Asset History' },
      { name: 'Asset Relationships' },
      { name: 'Asset Contracts' },
      { name: 'Asset Financials' },
      { name: 'Product Types' },
      { name: 'Product Type Fields' },
      { name: 'Products' },
      { name: 'Vendors' },
      { name: 'Asset States' },
      { name: 'Manufacturers' },
      { name: 'Software' },
      { name: 'Software Types' },
      { name: 'Software Categories' },
      { name: 'Software License Types' },
      { name: 'Software Licenses' },
      { name: 'Software Installations' },
      { name: 'Software License Agreements' },
      { name: 'License Agreements' },
      { name: 'Global Software Licenses' },
      { name: 'Service Packs' },
      { name: 'Software Summary' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token as: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    paths,
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerUiOptions: SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
};
