import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Loader2 } from 'lucide-react';
import { getGlobalLicense } from '../services/globalSoftwareLicenseService';
import type { SoftwareLicense } from '../types';

function value(v: unknown) {
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}

function dateValue(v: string | null) {
  if (!v) return '-';
  return new Date(v).toLocaleDateString();
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[170px_1fr] items-start gap-6 py-2.5">
      <dt className="text-right text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</dt>
      <dd className="text-sm text-gray-600 dark:text-gray-300">{children}</dd>
    </div>
  );
}

export default function SoftwareLicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [license, setLicense] = useState<SoftwareLicense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getGlobalLicense(id)
      .then(setLicense)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Software License</h1>
        </div>
        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">License not found.</div>
      </div>
    );
  }

  const softwareName = license.software?.name ?? 'Software';
  const licenseName = `${softwareName} - ${license.id}`;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Software &gt; Software Licenses &gt; <span className="text-blue-600 dark:text-blue-400">{licenseName}</span>
        </p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{softwareName}</h1>
          <button
            onClick={() => navigate(`/software/licenses/edit/${license.id}`)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Edit size={14} /> Edit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex justify-end">
            <div className="min-w-56 rounded border border-blue-100 bg-blue-50 px-5 py-3 text-sm dark:border-blue-900/60 dark:bg-blue-950/30">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <span className="font-semibold text-gray-700 dark:text-gray-200">Status</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{license.isActive ? 'Active' : 'Inactive'}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Purchased</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{license.purchased}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Available</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{license.available}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Software License Details</h2>
            </div>
            <div className="grid gap-x-16 px-5 py-4 md:grid-cols-2">
              <div>
                <DetailItem label="License Name">{licenseName}</DetailItem>
                <DetailItem label="Software">
                  <span className="text-blue-600 dark:text-blue-400">{value(license.software?.name)}</span>
                </DetailItem>
                <DetailItem label="License Type">{value(license.licenseType)}</DetailItem>
                <DetailItem label="License Option">{value(license.licenseOption)}</DetailItem>
                <DetailItem label="Acquisition Date">{dateValue(license.acquiredDate)}</DetailItem>
                <DetailItem label="Expiry Date">{dateValue(license.expiryDate)}</DetailItem>
                <DetailItem label="License Key">{value(license.licenseKey)}</DetailItem>
                <DetailItem label="Installation(s) Allowed">{license.installationsAllowed}</DetailItem>
              </div>
              <div>
                <DetailItem label="Manufacturer">{value(license.software?.manufacturer?.name)}</DetailItem>
                <DetailItem label="Agreement Number">{value(license.agreement?.agreementName)}</DetailItem>
                <DetailItem label="Cost($)">{value(license.purchaseCost ?? 0)}</DetailItem>
                <DetailItem label="Vendor">{value(license.vendor?.name)}</DetailItem>
                <DetailItem label="Purchased For">{value(license.purchasedFor)}</DetailItem>
                <DetailItem label="Site">{value(license.allocatedSite)}</DetailItem>
                <DetailItem label="Description">-</DetailItem>
                <DetailItem label="Allocated">{license.allocated}</DetailItem>
              </div>
            </div>
            <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Additional Information</h2>
            </div>
            <div className="px-5 py-4">
              <DetailItem label="Critical license">{license.isCritical ? 'Yes' : '-'}</DetailItem>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Allocated To</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">0 - 0 of 0</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Workstation</th>
                    <th className="px-4 py-3 text-left">Software</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Usage</th>
                    <th className="px-4 py-3 text-left">Scanned License Key</th>
                    <th className="px-4 py-3 text-left">Allocated License</th>
                    <th className="px-4 py-3 text-left">Installed On</th>
                    <th className="px-4 py-3 text-left">Allocated License Key</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      No software installations found in this view
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
