import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, SWEDISH_CITIES } from "@/lib/constants";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceFormValues = {
  title: string;
  category: string;
  description: string;
  city: string;
  price_sek: number;
  price_type: "fixed" | "from";
  cover_image_url?: string | null;
};

interface Props {
  initial?: Partial<ServiceFormValues>;
  showCity?: boolean;
  showImage?: boolean;
  submitLabel?: string;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  uploadUserId?: string;
}

const ServiceForm = ({
  initial,
  showCity = true,
  showImage = true,
  submitLabel = "Spara",
  onSubmit,
  uploadUserId,
}: Props) => {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0].name);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [price, setPrice] = useState(String(initial?.price_sek ?? ""));
  const [priceType, setPriceType] = useState<"fixed" | "from">(initial?.price_type ?? "from");
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.cover_image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!uploadUserId) {
      toast.error("Du måste vara inloggad för att ladda upp bilder.");
      return;
    }
    setUploading(true);
    try {
      const path = `${uploadUserId}/services/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("task-photos").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("task-photos").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    } catch (e: any) {
      toast.error(e.message || "Uppladdning misslyckades");
    } finally {
      setUploading(false);
    }
  };

  const canSubmit =
    title.trim().length > 2 &&
    description.trim().length > 2 &&
    parseInt(price) > 0 &&
    (!showCity || city.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        description: description.trim(),
        city: city.trim(),
        price_sek: parseInt(price),
        price_type: priceType,
        cover_image_url: coverUrl,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-5 md:p-7 shadow-card">
      <div>
        <Label>Kategori</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1.5 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="svc-title">Titel</Label>
        <Input
          id="svc-title"
          placeholder="T.ex. Jag hjälper med IKEA-montering"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 h-12 text-base"
          maxLength={80}
        />
      </div>

      <div>
        <Label htmlFor="svc-desc">Beskrivning</Label>
        <Textarea
          id="svc-desc"
          placeholder="Berätta vad du erbjuder, vad ingår, dina villkor."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 min-h-[120px] text-base"
        />
      </div>

      {showImage && (
        <div>
          <Label>Omslagsbild (valfritt)</Label>
          <div className="mt-1.5">
            {coverUrl ? (
              <div className="relative w-full max-w-xs aspect-[4/3] rounded-lg overflow-hidden border border-border">
                <img src={coverUrl} alt="Omslag" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/90 flex items-center justify-center shadow"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full max-w-xs aspect-[4/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 transition-colors"
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                <span className="text-xs mt-1">Ladda upp bild</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </div>
        </div>
      )}

      {showCity && (
        <div>
          <Label htmlFor="svc-city">Stad</Label>
          <Input
            id="svc-city"
            placeholder="Stad där du erbjuder tjänsten"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1.5 h-11"
            list="svc-city-list"
          />
          <datalist id="svc-city-list">
            {SWEDISH_CITIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label htmlFor="svc-price">Pris (SEK)</Label>
          <Input
            id="svc-price"
            type="number"
            min={1}
            placeholder="500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1.5 h-12 text-base"
          />
        </div>
        <div>
          <Label>Typ</Label>
          <Select value={priceType} onValueChange={(v) => setPriceType(v as any)}>
            <SelectTrigger className="mt-1.5 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="from">Från</SelectItem>
              <SelectItem value="fixed">Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        variant="hero"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting || uploading}
      >
        {submitting ? "Sparar…" : submitLabel}
      </Button>
    </div>
  );
};

export default ServiceForm;
