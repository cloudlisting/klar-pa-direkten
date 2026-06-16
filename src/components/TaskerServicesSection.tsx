import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";
import OrderServiceButton from "./OrderServiceButton";

type Row = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  price_sek: number | null;
  price_type: "fixed" | "from";
  is_active: boolean;
};

interface Props {
  profileUserId: string;
  isOwner: boolean;
  taskerName?: string | null;
}

const TaskerServicesSection = ({ profileUserId, isOwner, taskerName }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("tasker_services")
      .select("*")
      .eq("user_id", profileUserId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setRows((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [profileUserId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laddar tjänster…</p>;
  }

  const visibleRows = isOwner ? rows : rows.filter((r) => r.is_active);
  if (!isOwner && visibleRows.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground">
          Tjänster {taskerName ? `${taskerName} erbjuder` : "som erbjuds"}
        </h2>
        {isOwner && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus size={14} /> Lägg till
          </Button>
        )}
      </div>

      {adding && isOwner && (
        <EditRow
          onCancel={() => setAdding(false)}
          onSave={async (values) => {
            const { error } = await supabase.from("tasker_services").insert({ ...values, user_id: profileUserId } as any);
            if (error) { toast.error(error.message); return; }
            toast.success("Tjänsten tillagd");
            setAdding(false);
            load();
          }}
        />
      )}

      {visibleRows.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">
          {isOwner ? "Du har inte lagt till några tjänster ännu." : "Inga tjänster ännu."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleRows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-3">
              {editingId === r.id ? (
                <EditRow
                  initial={r}
                  onCancel={() => setEditingId(null)}
                  onSave={async (values) => {
                    const { error } = await supabase.from("tasker_services").update(values as any).eq("id", r.id);
                    if (error) { toast.error(error.message); return; }
                    toast.success("Sparat");
                    setEditingId(null);
                    load();
                  }}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{r.title}</span>
                      <span className="text-xs text-muted-foreground">{r.category}</span>
                      {isOwner && !r.is_active && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Inaktiv</span>}
                    </div>
                    {r.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                    {r.price_sek != null && (
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {r.price_type === "from" ? "Från " : ""}{r.price_sek} kr
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {isOwner ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(r.id)}><Edit2 size={14} /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                          if (!confirm("Ta bort?")) return;
                          const { error } = await supabase.from("tasker_services").delete().eq("id", r.id);
                          if (error) { toast.error(error.message); return; }
                          load();
                        }}><Trash2 size={14} /></Button>
                      </>
                    ) : (
                      <OrderServiceButton
                        taskerUserId={profileUserId}
                        taskerName={taskerName ?? undefined}
                        category={r.category}
                        title={r.title}
                        price={r.price_sek ?? undefined}
                        taskerServiceId={r.id}
                        size="sm"
                        variant="hero"
                        label="Beställ"
                      />
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const EditRow = ({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Row>;
  onCancel: () => void;
  onSave: (v: { category: string; title: string; description: string | null; price_sek: number | null; price_type: "fixed" | "from"; is_active: boolean }) => Promise<void>;
}) => {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0].name);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price_sek != null ? String(initial.price_sek) : "");
  const [priceType, setPriceType] = useState<"fixed" | "from">(initial?.price_type ?? "from");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.name}>{c.icon} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Pristyp</Label>
          <Select value={priceType} onValueChange={(v) => setPriceType(v as any)}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="from">Från</SelectItem>
              <SelectItem value="fixed">Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Titel</Label>
        <Input className="h-9 mt-1" placeholder="T.ex. Montera IKEA-möbel" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
      </div>
      <div>
        <Label className="text-xs">Beskrivning (valfritt)</Label>
        <Textarea className="mt-1 min-h-[70px]" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2 items-end">
        <div>
          <Label className="text-xs">Pris (kr, valfritt)</Label>
          <Input className="h-9 mt-1" type="number" min={0} placeholder="500" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" /> Synlig
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="hero"
          disabled={title.trim().length < 3 || saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                category,
                title: title.trim(),
                description: description?.trim() || null,
                price_sek: price ? parseInt(price) : null,
                price_type: priceType,
                is_active: active,
              });
            } finally { setSaving(false); }
          }}
        >
          <Check size={14} /> Spara
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X size={14} /> Avbryt</Button>
      </div>
    </div>
  );
};

export default TaskerServicesSection;
