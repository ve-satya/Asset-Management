import { useEffect, useMemo, useState } from 'react';
import { resolveProductTypeFields } from '../../services/productTypeFieldService';
import type { DynamicAssetField } from '../../types';
import { Field, Section, inputClass } from './AssetFormLayout';
import type { AssetFormState } from './assetFormTypes';

interface Props {
  productTypeId?: string;
  form: AssetFormState;
  onDynamicFieldChange: (fieldId: number, value: string | boolean) => void;
}

interface SectionGroup {
  key: string;
  title: string;
  fields: DynamicAssetField[];
}

/**
 * Dynamic metadata-driven asset form.
 *
 * It resolves the selected Product Type hierarchy on the server, then renders:
 * ancestor inherited fields first, followed by current product type fields.
 * No product type switch/case is used here; future Product Type Master fields
 * become visible as soon as metadata is added.
 */
export default function AssetDynamicFormRenderer({ productTypeId, form, onDynamicFieldChange }: Props) {
  const [fields, setFields] = useState<DynamicAssetField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productTypeId) {
      setFields([]);
      return;
    }
    setLoading(true);
    resolveProductTypeFields(productTypeId)
      .then((result) => setFields(result.fields))
      .catch((error) => {
        console.error(error);
        setFields([]);
      })
      .finally(() => setLoading(false));
  }, [productTypeId]);

  const groups = useMemo<SectionGroup[]>(() => {
    const map = new Map<string, SectionGroup>();
    fields.forEach((field) => {
      const sourceName = field.sourceProductType?.displayName || 'Dynamic';
      const sectionName = field.sectionName || `${sourceName} Details`;
      const key = `${field.productTypeId}:${sectionName}`;
      if (!map.has(key)) {
        map.set(key, { key, title: sectionName, fields: [] });
      }
      map.get(key)!.fields.push(field);
    });
    return Array.from(map.values());
  }, [fields]);

  if (loading) return null;

  if (!groups.length) return null;

  return (
    <>
      {groups.map((group) => (
        <Section key={group.key} title={group.title}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-28 gap-y-3">
            {group.fields.map((field) => (
              <Field key={field.id} label={field.fieldName} req={field.required}>
                <DynamicInput
                  field={field}
                  value={form.dynamicFieldValues[String(field.id)]}
                  onChange={(value) => onDynamicFieldChange(field.id, value)}
                />
              </Field>
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}

function DynamicInput({ field, value, onChange }: { field: DynamicAssetField; value: string | boolean | undefined; onChange: (value: string | boolean) => void }) {
  if (field.fieldType === 'textarea') {
    return <textarea value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} rows={2} className={`${inputClass()} h-12 py-1.5 resize-y`} />;
  }
  if (field.fieldType === 'checkbox') {
    return <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="mt-2 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />;
  }
  return (
    <input
      type={field.fieldType === 'number' || field.fieldType === 'date' ? field.fieldType : 'text'}
      value={String(value ?? '')}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass()}
    />
  );
}
