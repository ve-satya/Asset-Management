import { useSearchParams } from 'react-router-dom';
import ProductTypeTable        from '../components/product-type/ProductTypeTable';
import ProductTable            from '../components/product/ProductTable';
import VendorTable             from '../components/vendor/VendorTable';
import SoftwareTypeTable       from '../components/software-type/SoftwareTypeTable';
import SoftwareCategoryTable   from '../components/software-category/SoftwareCategoryTable';
import SoftwareLicenseTypeTable from '../components/software-license-type/SoftwareLicenseTypeTable';
import AssetStateTable          from '../components/asset-state/AssetStateTable';
import ManufacturerTable        from '../components/manufacturer/ManufacturerTable';

const TABS = [
  { key: 'producttype',         label: 'Product Type'          },
  { key: 'product',             label: 'Product'               },
  { key: 'vendor',              label: 'Vendor'                },
  { key: 'softwaretype',        label: 'Software Type'         },
  { key: 'softwarecategory',    label: 'Software Category'     },
  { key: 'softwarelicensetype', label: 'Software License Type' },
  { key: 'assetstate',          label: 'Asset State'           },
  { key: 'manufacturer',        label: 'Manufacturer'          },
];

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-2xl">📋</div>
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm mt-1">This module is coming soon.</p>
    </div>
  );
}

export default function Assets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'producttype';

  function handleTab(key: string) { setSearchParams({ tab: key }); }

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-4 pb-0">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Master Assets - Asset - {TABS.find((t) => t.key === activeTab)?.label || 'Product Type'}
        </h1>
      </div>

      <div className="px-6 mt-3 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-0 overflow-x-auto scrollbar-thin -mb-px">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => handleTab(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'producttype'         ? <ProductTypeTable />
         : activeTab === 'product'           ? <ProductTable />
         : activeTab === 'vendor'            ? <VendorTable />
         : activeTab === 'softwaretype'      ? <SoftwareTypeTable />
         : activeTab === 'softwarecategory'  ? <SoftwareCategoryTable />
         : activeTab === 'softwarelicensetype' ? <SoftwareLicenseTypeTable />
         : activeTab === 'assetstate'        ? <AssetStateTable />
         : activeTab === 'manufacturer'      ? <ManufacturerTable />
         : <Placeholder label={TABS.find((t) => t.key === activeTab)?.label || ''} />
        }
      </div>
    </div>
  );
}
