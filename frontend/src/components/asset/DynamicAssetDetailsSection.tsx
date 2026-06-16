import { useEffect, useMemo, useState } from 'react';
import { resolveProductTypeFields } from '../../services/productTypeFieldService';
import type { AssetDynamicFieldValue, DynamicAssetField } from '../../types';

interface Props {
  assetId: number;
  productTypeId?: number | string | null;
  savedValues?: AssetDynamicFieldValue[];
}

interface SectionGroup {
  key: string;
  title: string;
  fields: DynamicAssetField[];
}

/**
 * Read-only dynamic asset details.
 *
 * This mirrors AssetDynamicFormRenderer: field definitions are resolved from
 * the selected Product Type hierarchy so parent fields render before current
 * Product Type fields, without hardcoding Computer, OS, Printer, etc. sections.
 */
export default function DynamicAssetDetailsSection({ assetId, productTypeId, savedValues = [] }: Props) {
  const [fields, setFields] = useState<DynamicAssetField[]>([]);

  useEffect(() => {
    if (!assetId || !productTypeId) {
      setFields([]);
      return;
    }

    resolveProductTypeFields(productTypeId)
      .then((result) => setFields(result.fields))
      .catch((error) => {
        console.error(error);
        setFields([]);
      });
  }, [assetId, productTypeId]);

  const valueMap = useMemo(() => {
    return Object.fromEntries(savedValues.map((item) => [String(item.productTypeFieldId), item.value]));
  }, [savedValues]);

  const groups = useMemo<SectionGroup[]>(() => {
    const map = new Map<string, SectionGroup>();
    fields.forEach((field) => {
      const sourceName = field.sourceProductType?.displayName || 'Dynamic';
      const sectionName = field.sectionName || `${sourceName} Details`;
      const key = `${field.productTypeId}:${sectionName}`;
      if (!map.has(key)) map.set(key, { key, title: sectionName, fields: [] });
      map.get(key)!.fields.push(field);
    });
    return Array.from(map.values()).filter((group) => group.fields.length > 0);
  }, [fields]);

  if (!groups.length) return null;

  return (
    <>
      {groups.map((group) => (
        <Section key={group.key} title={group.title}>
          <Grid2>
            {group.fields.map((field) => (
              <Field
                key={field.id}
                label={field.fieldName}
                value={formatDynamicValue(field, valueMap[String(field.id)])}
              />
            ))}
          </Grid2>
        </Section>
      ))}
    </>
  );
}

function formatDynamicValue(field: DynamicAssetField, value: string | null | undefined) {
  if (value == null || value === '') return null;
  if (field.fieldType === 'checkbox') {
    return value === 'true' || value === '1' ? 'Yes' : 'No';
  }
  if (field.fieldType === 'date') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }
  return value;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value != null && value !== '' ? String(value) : <span className="text-gray-400 dark:text-gray-600">-</span>;
  return (
    <div className="grid min-w-0 grid-cols-[170px_minmax(0,1fr)] items-baseline gap-4">
      <span className="text-right text-[11px] text-gray-600 dark:text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-[11px] font-medium text-gray-900 dark:text-gray-200">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="border-b border-gray-200 px-3 pb-2 pt-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">{title}</h3>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-16 gap-y-3 xl:grid-cols-2">{children}</div>;
}
