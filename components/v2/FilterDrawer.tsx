import { FiX } from "react-icons/fi";
import { cn } from "./cn";
import { Button } from "./Button";

/** Real /cert filter shape (mirrors the metadata getAll zod schema). */
export interface BuffaloFilter {
  sex: "all" | "female" | "male";
  color: "all" | "black" | "albino";
  ageOperator: ">" | "<" | ">=" | "<=" | "=";
  ageValue: string;
  sortBy: "latest" | "oldest" | "youngest";
}

export const DEFAULT_FILTER: BuffaloFilter = {
  sex: "all",
  color: "all",
  ageOperator: ">=",
  ageValue: "",
  sortBy: "latest",
};

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  value: BuffaloFilter;
  onChange: (patch: Partial<BuffaloFilter>) => void;
  onReset: () => void;
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            className={cn(
              "rounded-pill border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              o.value === value
                ? "border-accent bg-accent text-background"
                : "border-border-soft bg-surface text-muted hover:text-accent"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * FilterDrawer — themed bottom-sheet (mobile) / centered panel (≥sm) exposing the REAL
 * /cert filters: sex · color · age (operator + months) · sort. No invented status categories.
 */
export function FilterDrawer({ open, onClose, value, onChange, onReset }: FilterDrawerProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center sm:items-center",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* scrim */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-overlay-badge transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ตัวกรอง"
        className={cn(
          "relative w-full max-w-md rounded-t-[24px] border border-border-soft bg-surface-raised p-5 shadow-gold transition-transform duration-300 sm:rounded-card",
          "max-h-[85vh] overflow-y-auto",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-4"
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">ตัวกรอง</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-border-soft text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <Segmented
            label="เพศ"
            value={value.sex}
            onSelect={(v) => onChange({ sex: v })}
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "female", label: "เพศเมีย" },
              { value: "male", label: "เพศผู้" },
            ]}
          />
          <Segmented
            label="สี"
            value={value.color}
            onSelect={(v) => onChange({ color: v })}
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "black", label: "สีดำ" },
              { value: "albino", label: "เผือก" },
            ]}
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">อายุ (เดือน)</p>
            <div className="flex gap-2">
              <select
                value={value.ageOperator}
                onChange={(e) => onChange({ ageOperator: e.target.value as BuffaloFilter["ageOperator"] })}
                className="rounded-pill border border-border-soft bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <option value=">=">มากกว่าหรือเท่ากับ</option>
                <option value=">">มากกว่า</option>
                <option value="=">เท่ากับ</option>
                <option value="<">น้อยกว่า</option>
                <option value="<=">น้อยกว่าหรือเท่ากับ</option>
              </select>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="จำนวนเดือน"
                value={value.ageValue}
                onChange={(e) => onChange({ ageValue: e.target.value })}
                className="w-28 rounded-pill border border-border-soft bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              />
            </div>
          </div>

          <Segmented
            label="เรียงลำดับ"
            value={value.sortBy}
            onSelect={(v) => onChange({ sortBy: v })}
            options={[
              { value: "latest", label: "ล่าสุด" },
              { value: "oldest", label: "เก่าสุด" },
              { value: "youngest", label: "อายุน้อยสุด" },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="gold-outline" block onClick={onReset}>
              ล้างตัวกรอง
            </Button>
            <Button variant="gold-fill" block onClick={onClose}>
              ดูผลลัพธ์
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
