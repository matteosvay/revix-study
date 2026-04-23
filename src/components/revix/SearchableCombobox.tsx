import { useState, useMemo, forwardRef } from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type ComboItem = { value: string; label: string; group?: string; emoji?: string };

type Props = {
  items: ComboItem[];
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
};

/** Notion-style searchable picker with grouped results. */
export const SearchableCombobox = forwardRef<HTMLDivElement, Props>(function SearchableCombobox({
  items, value, onChange, placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...", emptyText = "Aucun résultat", className,
}, ref) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = !query ? items : items.filter(i =>
      i.label.toLowerCase().includes(query) ||
      (i.group?.toLowerCase().includes(query) ?? false)
    );
    const groups: Record<string, ComboItem[]> = {};
    list.slice(0, 80).forEach(i => {
      const g = i.group ?? "—";
      (groups[g] ??= []).push(i);
    });
    return groups;
  }, [items, q]);

  const selected = items.find(i => i.value === value);

  return (
    <div ref={ref}>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-10 px-3 rounded-md border bg-background text-sm text-left flex items-center justify-between gap-2 hover:border-primary/50 transition-colors",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate flex items-center gap-1.5">
            {selected?.emoji && <span>{selected.emoji}</span>}
            {selected?.label ?? placeholder}
          </span>
          <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-80 overflow-hidden" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 pr-7 text-sm"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto max-h-64 p-1">
          {Object.keys(filtered).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{emptyText}</p>
          ) : (
            Object.entries(filtered).map(([group, list]) => (
              <div key={group} className="mb-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                {list.map(i => (
                  <button
                    key={i.value}
                    onClick={() => { onChange(i.value); setOpen(false); setQ(""); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded-md hover:bg-muted transition-colors",
                      i.value === value && "bg-primary/10 text-primary"
                    )}
                  >
                    {i.emoji && <span className="text-base shrink-0">{i.emoji}</span>}
                    <span className="flex-1 truncate">{i.label}</span>
                    {i.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
    </div>
  );
});

/** Multi-select variant for tags (subjects). */
type MultiProps = Omit<Props, "value" | "onChange"> & {
  values: string[];
  onChange: (v: string[]) => void;
  max?: number;
};

export const SearchableMultiCombobox = forwardRef<HTMLDivElement, MultiProps>(function SearchableMultiCombobox({
  items, values, onChange, placeholder = "Ajouter...", searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat", max, className,
}, ref) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = !query ? items : items.filter(i =>
      i.label.toLowerCase().includes(query) ||
      (i.group?.toLowerCase().includes(query) ?? false)
    );
    const groups: Record<string, ComboItem[]> = {};
    list.slice(0, 80).forEach(i => {
      const g = i.group ?? "—";
      (groups[g] ??= []).push(i);
    });
    return groups;
  }, [items, q]);

  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter(x => x !== v));
    else if (!max || values.length < max) onChange([...values, v]);
  };

  const selectedItems = values.map(v => items.find(i => i.value === v)).filter(Boolean) as ComboItem[];

  return (
    <div ref={ref} className={className}>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedItems.map(i => (
            <span key={i.value} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {i.emoji && <span>{i.emoji}</span>}
              {i.label}
              <button onClick={() => toggle(i.value)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="rounded-full text-xs">
            <Search className="h-3 w-3 mr-1" /> {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72 max-h-80 overflow-hidden" align="start">
          <div className="p-2 border-b">
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="h-8 text-sm" />
          </div>
          <div className="overflow-y-auto max-h-64 p-1">
            {Object.keys(filtered).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">{emptyText}</p>
            ) : (
              Object.entries(filtered).map(([group, list]) => (
                <div key={group} className="mb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                  {list.map(i => {
                    const checked = values.includes(i.value);
                    return (
                      <button
                        key={i.value}
                        onClick={() => toggle(i.value)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded-md hover:bg-muted transition-colors",
                          checked && "bg-primary/10 text-primary"
                        )}
                      >
                        {i.emoji && <span className="text-base shrink-0">{i.emoji}</span>}
                        <span className="flex-1 truncate">{i.label}</span>
                        {checked && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          {max && (
            <div className="border-t p-2 text-[10px] text-muted-foreground text-center">
              {values.length} / {max}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
});