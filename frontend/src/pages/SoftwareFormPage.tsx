import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ImageIcon, X, Loader2, Plus } from 'lucide-react';
import {
  getSoftware, createSoftware, updateSoftware,
  uploadSoftwareImage, deleteSoftwareImage,
} from '../services/softwareService';
import { getAllSoftwareTypes }        from '../services/softwareTypeService';
import { getAllSoftwareCategories }   from '../services/softwareCategoryService';
import { getAllManufacturers }        from '../services/manufacturerService';
import { getAllSoftwareLicenseTypes } from '../services/softwareLicenseTypeService';
import type { NamedOption } from '../types';

const EMPTY = {
  name: '', version: '', softwareTypeId: '', softwareCategoryId: '',
  manufacturerId: '', licenseTypeId: '', description: '',
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
export default function SoftwareFormPage() {
  const navigate     = useNavigate();
  const { id }       = useParams<{ id: string }>();
  const isEdit       = Boolean(id);
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
  const [licenseTypes,       setLicenseTypes]       = useState<NamedOption[]>([]);

  /* load dropdown options */
  useEffect(() => {
    Promise.all([
      getAllSoftwareTypes(),
      getAllSoftwareCategories(),
      getAllManufacturers(),
      getAllSoftwareLicenseTypes(),
    ]).then(([st, sc, mfr, lt]) => {
      setSoftwareTypes(st);
      setSoftwareCategories(sc);
      setManufacturers(mfr);
      setLicenseTypes(lt);
    });
  }, []);

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

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
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
        description:        form.description.trim()  || null,
      };

      if (isEdit && id) {
        await updateSoftware(id, payload);
        navigate(`/software/detail/${id}`);
      } else {
        const created = await createSoftware(payload);
        /* upload any queued images */
        if (pending.length) {
          await Promise.all(pending.map((p) => uploadSoftwareImage(created.id, p.file)));
        }
        navigate(`/software/detail/${created.id}`);
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

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Software' : 'New Software'}
        </h1>
      </div>

      {/* ── Scrollable form body ─────────────────────────────────── */}
      <div className="flex-1 overflow-auto py-6 px-4 sm:px-8">
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
                  {/* Software Name */}
                  <FieldRow label="Software Name" required error={errors.name}>
                    <input
                      name="name"
                      value={form.name}
                      onChange={ch}
                      placeholder="Enter software name"
                      className={fieldCls(!!errors.name)}
                    />
                  </FieldRow>

                  {/* Software Type */}
                  <FieldRow label="Software Type" required error={errors.softwareTypeId}>
                    <select
                      name="softwareTypeId"
                      value={form.softwareTypeId}
                      onChange={ch}
                      className={fieldCls(!!errors.softwareTypeId)}
                    >
                      <option value="">Select type</option>
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
                </div>

                {/* ── Right column ────────────────────────────────── */}
                <div className="space-y-4">
                  {/* Version */}
                  <FieldRow label="Version">
                    <input
                      name="version"
                      value={form.version}
                      onChange={ch}
                      placeholder="Enter version"
                      className={fieldCls()}
                    />
                  </FieldRow>

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

                  {/* License Type (optional) */}
                  <FieldRow label="License Type">
                    <select
                      name="licenseTypeId"
                      value={form.licenseTypeId}
                      onChange={ch}
                      className={fieldCls()}
                    >
                      <option value="">Select license type</option>
                      {licenseTypes.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
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
                onClick={() => navigate(-1)}
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
