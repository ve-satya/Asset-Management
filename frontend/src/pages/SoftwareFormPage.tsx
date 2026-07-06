import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ImageIcon, X, Loader2, Plus } from 'lucide-react';
import {
  getSoftware, getAllSoftwares, createSoftware, updateSoftware,
  uploadSoftwareImage, deleteSoftwareImage,
} from '../services/softwareService';
import { getAllSoftwareTypes }        from '../services/softwareTypeService';
import { getAllSoftwareCategories }   from '../services/softwareCategoryService';
import { getAllManufacturers }        from '../services/manufacturerService';
import type { NamedOption } from '../types';

const EMPTY = {
  name: '', version: '', softwareTypeId: '', softwareCategoryId: '',
  manufacturerId: '', licenseTypeId: '', description: '', isSoftwareSuite: false,
};

const MAX_SLOTS = 5;

/* ── tiny helper components ───────────────────────────────────────────── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0 w-40">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

function FieldRow({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Label required={required}>{label}</Label>
      <div className="flex-1 min-w-0">
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

/* ── input / select class helpers ─────────────────────────────────────── */
const fieldCls = (hasErr?: boolean) =>
  `w-full h-9 px-3 text-sm rounded border ${
    hasErr
      ? 'border-red-400 focus:ring-red-400'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition`;

function manufacturerAlias(name?: string | null) {
  const normalized = (name || '').trim().toLowerCase();
  return normalized === 'microsoft corporation' ? 'microsoft' : normalized;
}

function SuiteValidationBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex items-center gap-2 rounded bg-red-500 px-3 py-1.5 text-sm font-semibold text-white shadow">
      <span className="absolute -top-2 left-8 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-red-500" />
      {children}
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-700 text-xs leading-none">x</span>
    </div>
  );
}

/* ── ImageSlot ────────────────────────────────────────────────────────── */
function ImageSlot({
  src, onRemove,
}: { src?: string; onRemove?: () => void }) {
  if (src) {
    return (
      <div className="relative group w-20 h-20 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
        <img src={src} alt="preview" className="w-full h-full object-cover" />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} className="text-white" />
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="w-20 h-20 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0">
      <ImageIcon size={20} className="text-gray-300 dark:text-gray-600" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
interface SoftwareFormPageProps {
  recordId?: string;
  embedded?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SoftwareFormPage({ recordId, embedded = false, onSuccess, onCancel }: SoftwareFormPageProps = {}) {
  const navigate     = useNavigate();
  const params       = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const id           = recordId ?? params.id;
  const isEdit       = Boolean(id);
  const createAsSuite = !isEdit && searchParams.get('suite') === 'true';
  const hideEditOnlyFields = embedded && isEdit;
  const dropRef      = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form,         setForm]        = useState(EMPTY);
  const [errors,       setErrors]      = useState<Record<string, string>>({});
  const [saving,       setSaving]      = useState(false);
  const [loading,      setLoading]     = useState(isEdit);
  const [dragOver,     setDragOver]    = useState(false);

  /* uploaded filenames (edit mode — already on server) */
  const [images,       setImages]      = useState<string[]>([]);
  /* pending local File objects (create mode — not yet uploaded) */
  const [pending,      setPending]     = useState<{ file: File; preview: string }[]>([]);
  const [uploading,    setUploading]   = useState(false);
  const [softwareId,   setSoftwareId]  = useState<number | null>(null);
  const [showImgPanel, setShowImgPanel]= useState(true);

  const [softwareTypes,      setSoftwareTypes]      = useState<NamedOption[]>([]);
  const [softwareCategories, setSoftwareCategories] = useState<NamedOption[]>([]);
  const [manufacturers,      setManufacturers]      = useState<NamedOption[]>([]);
  const [suiteOptions,       setSuiteOptions]       = useState<NamedOption[]>([]);
  const [suiteComponents,    setSuiteComponents]    = useState<NamedOption[]>([]);
  const [availableSelected,  setAvailableSelected]  = useState<string[]>([]);
  const [componentSelected,  setComponentSelected]  = useState<string[]>([]);
  const [suiteInstallRule,   setSuiteInstallRule]   = useState<'auto' | 'manual' | ''>('');
  const [suiteMessage,       setSuiteMessage]       = useState('');

  /* load dropdown options */
  useEffect(() => {
    Promise.all([
      getAllSoftwareTypes(),
      getAllSoftwareCategories(),
      getAllManufacturers(),
      getAllSoftwares(),
    ]).then(([st, sc, mfr, sw]) => {
      setSoftwareTypes(st);
      setSoftwareCategories(sc);
      setManufacturers(mfr);
      setSuiteOptions(sw);
      if (!isEdit) {
        const managed = st.find((type) => type.name === 'Managed');
        if (managed) {
          setForm((prev) => ({ ...prev, softwareTypeId: String(managed.id), isSoftwareSuite: createAsSuite }));
        }
      }
    });
  }, [createAsSuite, isEdit]);

  /* load existing record in edit mode */
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    getSoftware(id)
      .then((sw) => {
        setForm({
          name:               sw.name,
          version:            sw.version ?? '',
          softwareTypeId:     String(sw.softwareTypeId),
          softwareCategoryId: String(sw.softwareCategoryId),
          manufacturerId:     String(sw.manufacturerId),
          licenseTypeId:      sw.licenseTypeId ? String(sw.licenseTypeId) : '',
          description:        sw.description ?? '',
          isSoftwareSuite:    Boolean(sw.isSoftwareSuite),
        });
        setImages(sw.images ?? []);
        setSoftwareId(sw.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /* clean up object-URL previews on unmount */
  useEffect(() => {
    return () => { pending.forEach((p) => URL.revokeObjectURL(p.preview)); };
  }, [pending]);

  useEffect(() => {
    const selectedType = softwareTypes.find((type) => String(type.id) === form.softwareTypeId);
    if (selectedType && selectedType.name !== 'Managed' && form.isSoftwareSuite) {
      setForm((prev) => ({ ...prev, isSoftwareSuite: false }));
    }
  }, [softwareTypes, form.softwareTypeId, form.isSoftwareSuite]);

  useEffect(() => {
    const selectedManufacturer = manufacturers.find((manufacturer) => String(manufacturer.id) === form.manufacturerId);
    const selectedAlias = manufacturerAlias(selectedManufacturer?.name);
    setSuiteComponents((current) => current.filter((option) => (
      String(option.manufacturerId ?? '') === form.manufacturerId
      || (Boolean(selectedAlias) && manufacturerAlias(option.manufacturer?.name) === selectedAlias)
    )));
    setAvailableSelected([]);
    setComponentSelected([]);
  }, [form.manufacturerId, manufacturers]);

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'softwareTypeId') {
        const selectedType = softwareTypes.find((type) => String(type.id) === value);
        if (selectedType?.name !== 'Managed') next.isSoftwareSuite = false;
      }
      return next;
    });
    setErrors((p) => ({ ...p, [name]: '' }));
  }

  /* ── image helpers ───────────────────────────────────────────────────── */
  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const totalSlots = MAX_SLOTS - images.length - pending.length;
    const toAdd = Array.from(files).slice(0, totalSlots);
    if (!toAdd.length) return;

    if (softwareId) {
      /* edit mode — upload immediately */
      setUploading(true);
      Promise.all(toAdd.map((f) => uploadSoftwareImage(softwareId, f)))
        .then((results) => setImages(results[results.length - 1].images ?? []))
        .catch(console.error)
        .finally(() => setUploading(false));
    } else {
      /* create mode — queue locally */
      const newItems = toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) }));
      setPending((p) => [...p, ...newItems].slice(0, MAX_SLOTS));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [images.length, pending.length, softwareId]);

  async function removeServerImage(filename: string) {
    if (!softwareId) return;
    try {
      const updated = await deleteSoftwareImage(softwareId, filename);
      setImages(updated.images ?? []);
    } catch (e) { console.error(e); }
  }

  function removePending(idx: number) {
    setPending((p) => {
      URL.revokeObjectURL(p[idx].preview);
      return p.filter((_, i) => i !== idx);
    });
  }

  function selectedValues(event: React.ChangeEvent<HTMLSelectElement>) {
    return Array.from(event.target.selectedOptions).map((option) => option.value);
  }

  function addSuiteComponents() {
    if (!availableSelected.length) return;
    const toAdd = suiteOptions.filter((option) => availableSelected.includes(String(option.id)));
    setSuiteComponents((current) => [...current, ...toAdd.filter((option) => !current.some((item) => item.id === option.id))]);
    if (toAdd.length > 0 && suiteMessage === 'Choose suite component software.') setSuiteMessage('');
    setAvailableSelected([]);
  }

  function removeSuiteComponents() {
    if (!componentSelected.length) return;
    setSuiteComponents((current) => {
      const next = current.filter((option) => !componentSelected.includes(String(option.id)));
      if (suiteInstallRule === 'manual' && next.length === 0) setSuiteMessage('Choose suite component software.');
      return next;
    });
    setComponentSelected([]);
  }

  function changeSuiteInstallRule(rule: 'auto' | 'manual') {
    setSuiteInstallRule(rule);
    setSuiteMessage(rule === 'auto' ? 'Value cannot be empty.' : (suiteComponents.length === 0 ? 'Choose suite component software.' : ''));
  }

  /* drag-and-drop handlers */
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function onDragLeave() { setDragOver(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  /* ── submit ──────────────────────────────────────────────────────────── */
  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim())        errs.name               = 'Required';
    if (!form.softwareTypeId)     errs.softwareTypeId     = 'Required';
    if (!form.softwareCategoryId) errs.softwareCategoryId = 'Required';
    if (!form.manufacturerId)     errs.manufacturerId     = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        name:               form.name.trim(),
        version:            form.version.trim()      || null,
        softwareTypeId:     parseInt(form.softwareTypeId, 10),
        softwareCategoryId: parseInt(form.softwareCategoryId, 10),
        manufacturerId:     parseInt(form.manufacturerId, 10),
        licenseTypeId:      form.licenseTypeId ? parseInt(form.licenseTypeId, 10) : null,
        isSoftwareSuite:    form.isSoftwareSuite,
        description:        form.description.trim()  || null,
      };

      if (isEdit && id) {
        await updateSoftware(id, payload);
        if (embedded) onSuccess?.();
        else navigate(`/software/detail/${id}`);
      } else {
        const created = await createSoftware(payload);
        /* upload any queued images */
        if (pending.length) {
          await Promise.all(pending.map((p) => uploadSoftwareImage(created.id, p.file)));
        }
        if (embedded) onSuccess?.();
        else navigate(`/software/detail/${created.id}`);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; errors?: { msg: string }[] } } };
      setErrors({ submit: e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Save failed.' });
    } finally { setSaving(false); }
  }

  /* ── loading state ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  /* ── render image slots ──────────────────────────────────────────────── */
  const allPreviews: { src: string; onRemove: () => void }[] = [
    ...images.map((img, i) => ({
      src: `/uploads/softwares/${img}`,
      onRemove: () => removeServerImage(img),
      key: `s${i}`,
    })),
    ...pending.map((p, i) => ({
      src: p.preview,
      onRemove: () => removePending(i),
      key: `p${i}`,
    })),
  ];
  const emptySlots = Math.max(0, MAX_SLOTS - allPreviews.length);
  const canAddMore = allPreviews.length < MAX_SLOTS;
  const selectedSoftwareType = softwareTypes.find((type) => String(type.id) === form.softwareTypeId);
  const isManagedSoftware = selectedSoftwareType?.name === 'Managed';
  const selectedManufacturer = manufacturers.find((manufacturer) => String(manufacturer.id) === form.manufacturerId);
  const selectedManufacturerAlias = manufacturerAlias(selectedManufacturer?.name);
  const availableSuiteOptions = suiteOptions.filter((option) => (
    String(option.id) !== String(id || '')
    && (
      String(option.manufacturerId ?? '') === form.manufacturerId
      || (Boolean(selectedManufacturerAlias) && manufacturerAlias(option.manufacturer?.name) === selectedManufacturerAlias)
    )
    && !suiteComponents.some((item) => item.id === option.id)
  ));

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className={`${embedded ? 'flex flex-col bg-gray-50 dark:bg-gray-950' : 'flex flex-col h-full bg-gray-50 dark:bg-gray-950'}`}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => { if (embedded) onCancel?.(); else navigate(-1); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? `Edit - ${form.name || 'Software'}` : 'New Software'}
        </h1>
      </div>

      {/* ── Scrollable form body ─────────────────────────────────── */}
      <div className={`${embedded ? 'py-5 px-4 sm:px-6' : 'flex-1 overflow-auto py-6 px-4 sm:px-8'}`}>
        <form onSubmit={handleSubmit} noValidate className="max-w-5xl mx-auto">

          {/* ── Card ──────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-8 py-6 space-y-5">

              {/* Error banner */}
              {errors.submit && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {errors.submit}
                </div>
              )}

              {/* ── 2-column field grid ────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">

                {/* ── Left column ─────────────────────────────────── */}
                <div className="space-y-4">
                  {!hideEditOnlyFields && (
                    <FieldRow label="Software Name" required error={errors.name}>
                      <input
                        name="name"
                        value={form.name}
                        onChange={ch}
                        placeholder="Enter software name"
                        className={fieldCls(!!errors.name)}
                      />
                    </FieldRow>
                  )}

                  {/* Software Type */}
                  <FieldRow label="Software Type" required error={errors.softwareTypeId}>
                    <select
                      name="softwareTypeId"
                      value={form.softwareTypeId}
                      onChange={ch}
                      className={fieldCls(!!errors.softwareTypeId)}
                    >
                      {softwareTypes.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </FieldRow>

                  {/* Manufacturer */}
                  <FieldRow label="Manufacturer" required error={errors.manufacturerId}>
                    <div className="flex gap-2">
                      <select
                        name="manufacturerId"
                        value={form.manufacturerId}
                        onChange={ch}
                        className={fieldCls(!!errors.manufacturerId)}
                      >
                        <option value="">Please select the manufacturer</option>
                        {manufacturers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                      <button
                        type="button"
                        title="Add manufacturer"
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </FieldRow>

                  {!isEdit && (
                    <FieldRow label="Software Suite">
                      <label className={`inline-flex items-center gap-2 text-sm ${isManagedSoftware ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                        <input
                          type="checkbox"
                          checked={form.isSoftwareSuite}
                          disabled={!isManagedSoftware}
                          onChange={(event) => setForm((prev) => ({ ...prev, isSoftwareSuite: event.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </label>
                    </FieldRow>
                  )}
                </div>

                {/* ── Right column ────────────────────────────────── */}
                <div className="space-y-4">
                  {!hideEditOnlyFields && (
                    <FieldRow label="Version">
                      <input
                        name="version"
                        value={form.version}
                        onChange={ch}
                        placeholder="Enter version"
                        className={fieldCls()}
                      />
                    </FieldRow>
                  )}

                  {/* Software Category */}
                  <FieldRow label="Software Category" required error={errors.softwareCategoryId}>
                    <select
                      name="softwareCategoryId"
                      value={form.softwareCategoryId}
                      onChange={ch}
                      className={fieldCls(!!errors.softwareCategoryId)}
                    >
                      <option value="">Select category</option>
                      {softwareCategories.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </FieldRow>
                </div>
              </div>

              {/* ── Description — full width ───────────────────────── */}
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0 w-40 pt-2">Description</span>
                <div className="flex-1 min-w-0">
                  {/* Fake rich-text toolbar */}
                  <div className="flex items-center gap-1 px-3 py-1.5 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-md bg-gray-50 dark:bg-gray-800 flex-wrap">
                    {['B', 'I', 'U', 'S'].map((t) => (
                      <button key={t} type="button"
                        className={`w-6 h-6 text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center ${t === 'I' ? 'italic' : t === 'U' ? 'underline' : t === 'S' ? 'line-through' : ''}`}>
                        {t}
                      </button>
                    ))}
                    <span className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <span className="text-xs text-gray-400 px-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 h-6 flex items-center">Paragraph</span>
                    <span className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                    {['≡', '⁋', '⋮'].map((sym) => (
                      <button key={sym} type="button"
                        className="w-6 h-6 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center">
                        {sym}
                      </button>
                    ))}
                  </div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={ch}
                    rows={6}
                    placeholder="Enter description…"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-b-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition"
                  />
                </div>
              </div>

              {/* ── Images section — full width ────────────────────── */}
              <div>
                {/* Images header */}
                <button
                  type="button"
                  onClick={() => setShowImgPanel((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-gray-100 transition"
                >
                  Images
                  <Plus size={13} className="text-gray-400" />
                  <ChevronDown size={13} className={`text-gray-400 transition-transform ${showImgPanel ? '' : '-rotate-90'}`} />
                </button>

                {showImgPanel && (
                  <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex gap-4 flex-wrap items-start">
                      {/* Drop zone */}
                      <div
                        ref={dropRef}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => canAddMore && fileInputRef.current?.click()}
                        className={`flex-1 min-w-48 h-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors text-center px-4 ${
                          dragOver
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : canAddMore
                            ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {uploading ? (
                          <Loader2 size={20} className="animate-spin text-blue-500" />
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Drag and drop images here or{' '}
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Browse</span>
                          </p>
                        )}
                      </div>

                      {/* Thumbnail slots */}
                      <div className="flex gap-3 flex-wrap">
                        {allPreviews.map((p, i) => (
                          <ImageSlot key={i} src={p.src} onRemove={p.onRemove} />
                        ))}
                        {Array.from({ length: emptySlots }).map((_, i) => (
                          <ImageSlot key={`empty-${i}`} />
                        ))}
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </div>
                )}
              </div>

              {!isEdit && form.isSoftwareSuite && (
                <div className="space-y-5 border-t border-gray-200 pt-5 dark:border-gray-700">
                  <FieldRow label="Suite Component Software" required>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
                      <select multiple value={availableSelected} onChange={(event) => setAvailableSelected(selectedValues(event))} className="h-40 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                        {availableSuiteOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                      </select>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <button type="button" onClick={addSuiteComponents} disabled={availableSelected.length === 0} className="h-8 w-10 border border-gray-400 bg-gray-100 text-sm font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-40">&gt;&gt;</button>
                        <button type="button" onClick={removeSuiteComponents} disabled={componentSelected.length === 0} className="h-8 w-10 border border-gray-400 bg-gray-100 text-sm font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-40">&lt;&lt;</button>
                      </div>
                      <div>
                        <select multiple value={componentSelected} onChange={(event) => setComponentSelected(selectedValues(event))} className="h-40 w-full rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                          {suiteComponents.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                        {suiteMessage === 'Choose suite component software.' && (
                          <div className="mt-2">
                            <SuiteValidationBubble>Choose suite component software.</SuiteValidationBubble>
                          </div>
                        )}
                      </div>
                    </div>
                  </FieldRow>

                  <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <div className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:text-gray-100">
                      Identify Suite Installations <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500">?</span>
                    </div>
                    <div className="space-y-3 px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <p>Identify the suite installation based on the following rule</p>
                      <label className="flex flex-wrap items-center gap-2">
                        <input type="radio" name="suiteInstallRule" checked={suiteInstallRule === 'auto'} onChange={() => changeSuiteInstallRule('auto')} className="text-blue-600 focus:ring-blue-500" />
                        <span>Automatically discover as suite installation if the suite component software installation(s) is greater than or equal to</span>
                        <input type="text" className="h-7 w-14 border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
                        <span>in a computer.</span>
                      </label>
                      {suiteMessage === 'Value cannot be empty.' && (
                        <div className="ml-10">
                          <SuiteValidationBubble>Value cannot be empty.</SuiteValidationBubble>
                        </div>
                      )}
                      <label className="flex items-center gap-2">
                        <input type="radio" name="suiteInstallRule" checked={suiteInstallRule === 'manual'} onChange={() => changeSuiteInstallRule('manual')} className="text-blue-600 focus:ring-blue-500" />
                        <span>Manually choose suite installations</span>
                      </label>
                      <div>
                        <p className="mb-2 font-semibold">Matched suite installation(s)</p>
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-left uppercase dark:border-gray-700 dark:bg-gray-800">
                              <th className="w-10 px-2 py-2"><input type="checkbox" className="rounded border-gray-300 text-blue-600" /></th>
                              <th className="px-2 py-2">Workstation</th>
                              <th className="px-2 py-2">User</th>
                              <th className="px-2 py-2">Department</th>
                              <th className="px-2 py-2">Site</th>
                              <th className="px-2 py-2">Installed Component(s)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr><td colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-400">No installation(s) found.</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Action buttons — centered ──────────────────────── */}
            <div className="flex items-center justify-center gap-4 px-8 py-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition shadow-sm"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {isEdit ? 'Save' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => { if (embedded) onCancel?.(); else navigate(-1); }}
                disabled={saving}
                className="px-8 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
