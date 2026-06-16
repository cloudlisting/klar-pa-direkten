import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { Upload, MapPin, Loader2, Check, X, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SWEDISH_CITIES } from "@/lib/constants";

type TimingType = "asap" | "scheduled";

const DEFAULT_CATEGORY = "Övrigt";

const PostTask = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  const preTaskerId = searchParams.get("tasker");
  const preTaskerName = searchParams.get("tasker_name");
  const preServiceListingId = searchParams.get("service_id");
  const preTaskerServiceId = searchParams.get("tasker_service_id");
  const preCategory = searchParams.get("category");
  const preTitle = searchParams.get("title");
  const prePrice = searchParams.get("price");

  const [submitting, setSubmitting] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState(preTitle ?? "");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Location
  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Timing
  const [timingType, setTimingType] = useState<TimingType>("asap");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [price, setPrice] = useState(prePrice ?? "");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - photos.length);
    setPhotos((p) => [...p, ...arr]);
    setPhotoPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPhotoPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Din enhet stöder inte platsdelning. Fyll i platsen manuellt.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=sv`,
            { headers: { "Accept": "application/json" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const street = [addr.road, addr.house_number].filter(Boolean).join(" ");
          const guessedCity =
            addr.city || addr.town || addr.village || addr.municipality || "";
          if (street) setAddressText(street);
          else if (data.display_name) setAddressText(data.display_name.split(",")[0]);
          if (guessedCity) {
            const match = SWEDISH_CITIES.find(
              (c) => c.toLowerCase() === guessedCity.toLowerCase()
            );
            setCity(match || guessedCity);
          }
          setLocationConfirmed(false);
          toast.success("Plats hittad – kontrollera och bekräfta.");
        } catch {
          toast.message("Plats hittad. Fyll i adress och stad om de saknas.");
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        toast.error("Kunde inte hämta platsen. Fyll i manuellt.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canSubmit =
    title.trim().length > 2 &&
    description.trim().length > 2 &&
    city.trim().length > 0 &&
    parseInt(price) >= 1 &&
    (timingType === "asap" || (date && time));

  const uploadPhotos = async (taskId: string, uid: string) => {
    if (!photos.length) return;
    for (const file of photos) {
      const path = `${uid}/${taskId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("task-photos")
        .upload(path, file, { upsert: false });
      if (error) continue;
      const { data } = supabase.storage.from("task-photos").getPublicUrl(path);
      await supabase.from("task_photos").insert({ task_id: taskId, url: data.publicUrl });
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Ensure fresh session so auth.uid() works server-side for RLS
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }
      if (!session?.user) {
        toast.error("Din session har gått ut. Logga in igen.");
        navigate("/auth");
        return;
      }
      const uid = session.user.id;

      const priceNum = parseInt(price);
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          customer_user_id: uid,
          title: title.trim(),
          category: preCategory || DEFAULT_CATEGORY,
          description: description.trim(),
          city: city.trim(),
          address_optional: addressText.trim() || null,
          address_text: addressText.trim() || null,
          latitude: lat,
          longitude: lng,
          location_confirmed: locationConfirmed,
          timing_type: timingType,
          preferred_date: timingType === "scheduled" ? date : null,
          preferred_time: timingType === "scheduled" ? time : null,
          budget_type: "fixed" as const,
          budget_min_sek: priceNum,
          budget_max_sek: priceNum,
          is_remote_possible: false,
          status: "published" as const,
          assigned_tasker_id: preTaskerId || null,
          source_service_listing_id: preServiceListingId || null,
          source_tasker_service_id: preTaskerServiceId || null,
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      await uploadPhotos(data.id, uid);
      setCreatedTaskId(data.id);
      toast.success("Uppdraget är publicerat!");
    } catch (e: any) {
      toast.error(e.message || "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </Layout>
    );
  }

  if (createdTaskId) {
    return (
      <Layout>
        <div className="container max-w-md py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border bg-card p-8 text-center shadow-card"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">
              Ditt uppdrag är publicerat
            </h1>
            <p className="text-muted-foreground mb-6">
              Utförare kan nu skicka förfrågningar.
            </p>
            <div className="space-y-3">
              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link to={`/task/${createdTaskId}`}>Se mitt uppdrag</Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link to="/">Till startsidan</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-xl py-6 md:py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
              Vad behöver du hjälp med?
            </h1>
            <p className="text-sm text-muted-foreground">
              Beskriv uppdraget, välj plats och föreslå ett pris.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 md:p-7 shadow-card">
            {/* Titel */}
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                placeholder="T.ex. Hämta soffa från IKEA"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 h-12 text-base"
                maxLength={80}
              />
            </div>

            {/* Beskrivning */}
            <div>
              <Label htmlFor="desc">Beskrivning</Label>
              <Textarea
                id="desc"
                placeholder="Vad ska göras? Storlek, vikt, antal m.m."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 min-h-[110px] text-base"
              />
            </div>

            {/* Bilder */}
            <div>
              <Label>Ladda upp bilder (valfritt)</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={src} alt={`Bild ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label="Ta bort bild"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    <Upload size={18} />
                    <span className="text-[11px] mt-1">Lägg till</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handlePhotos(e.target.files)}
              />
            </div>

            {/* Plats */}
            <div>
              <Label>Plats</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Vi föreslår din plats automatiskt. Du kan ändra den innan du publicerar.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                disabled={gpsLoading}
                className="w-full h-11 gap-2 mb-3"
              >
                {gpsLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                {gpsLoading ? "Hämtar plats…" : "Använd min plats"}
              </Button>
              <Input
                placeholder="Adress (valfritt)"
                value={addressText}
                onChange={(e) => { setAddressText(e.target.value); setLocationConfirmed(false); }}
                className="h-11 mb-2"
              />
              <Input
                placeholder="Stad"
                value={city}
                onChange={(e) => { setCity(e.target.value); setLocationConfirmed(false); }}
                className="h-11"
                list="city-list"
              />
              <datalist id="city-list">
                {SWEDISH_CITIES.map((c) => <option key={c} value={c} />)}
              </datalist>
              {(addressText || city) && (
                <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={locationConfirmed}
                    onChange={(e) => setLocationConfirmed(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Jag bekräftar platsen
                </label>
              )}
            </div>

            {/* Tid */}
            <div>
              <Label>Tid</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimingType("asap")}
                  className={`h-12 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    timingType === "asap"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  }`}
                >
                  <Clock size={16} /> Nu / snarast
                </button>
                <button
                  type="button"
                  onClick={() => setTimingType("scheduled")}
                  className={`h-12 rounded-lg border text-sm font-medium transition-colors ${
                    timingType === "scheduled"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  }`}
                >
                  Välj datum och tid
                </button>
              </div>
              {timingType === "scheduled" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
                </div>
              )}
            </div>

            {/* Pris */}
            <div>
              <Label htmlFor="price">Vad vill du föreslå för pris?</Label>
              <div className="relative mt-1.5">
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-12 text-lg pr-12"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kr
                </span>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 left-0 right-0 mt-6 pb-safe">
            <Button
              variant="hero"
              size="lg"
              className="w-full h-13"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Publicerar…" : "Publicera uppdrag"}
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PostTask;
