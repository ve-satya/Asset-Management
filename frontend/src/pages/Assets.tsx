import { useSearchParams } from 'react-router-dom';
import ProductTypeTable        from '../components/product-type/ProductTypeTable';
import ProductTable            from '../components/product/ProductTable';
import VendorTable             from '../components/vendor/VendorTable';
import SoftwareTypeTable       from '../components/software-type/SoftwareTypeTable';
import SoftwareCategoryTable   from '../components/software-category/SoftwareCategoryTable';
import SoftwareLicenseTypeTable from '../components/software-license-type/SoftwareLicenseTypeTable';
import AssetStateTable          from '../components/asset-state/AssetStateTable';

const TABS = [
  { key: 'producttype',         label: 'Product Type'          },
  { key: 'product',             label: 'Product'               },
  { key: 'vendor',              label: 'Vendor'                },
  { key: 'softwaretype',        label: 'Software Type'         },
  { key: 'softwarecategory',    label: 'Software Category'     },
  { key: 'softwarelicensetype', label: 'Software License Types' },
  { key: 'assetstate',          label: 'Asset State'           },
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
    <div className="min-h-full bg-white dark:bg-gray-950">
      <section className="min-w-0 overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Customization - Asset Management - {TABS.find((t) => t.key === activeTab)?.label || 'Product Type'}
          </h1>
        </div>

        <div className="border-b border-gray-200 px-5 dark:border-gray-700">
          <nav className="-mb-px flex gap-3 overflow-x-auto scrollbar-thin">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => handleTab(key)}
                className={`whitespace-nowrap border-b-2 px-2 py-3 text-sm font-normal transition-colors ${
                  activeTab === key
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400 dark:border-sky-400'
                    : 'border-transparent text-gray-900 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-300 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-5 pt-2 pb-5">
          {activeTab === 'producttype'         ? <ProductTypeTable />
           : activeTab === 'product'           ? <ProductTable />
           : activeTab === 'vendor'            ? <VendorTable />
           : activeTab === 'softwaretype'      ? <SoftwareTypeTable />
           : activeTab === 'softwarecategory'  ? <SoftwareCategoryTable />
           : activeTab === 'softwarelicensetype' ? <SoftwareLicenseTypeTable />
           : activeTab === 'assetstate'        ? <AssetStateTable />
           : <Placeholder label={TABS.find((t) => t.key === activeTab)?.label || ''} />
          }
        </div>
      </section>
    </div>
  );
}
