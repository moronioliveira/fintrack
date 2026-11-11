import { CATEGORY_ICONS, PALETTE } from "@/lib/constants";
import { CategoryIcon } from "./icon";

/** Seletores baseados em radio + CSS (sem estado), utilizáveis em Server Components. */
export function ColorPicker({ name = "color", defaultValue = PALETTE[0] }: { name?: string; defaultValue?: string }) {
  const colors = PALETTE.includes(defaultValue) ? PALETTE : [defaultValue, ...PALETTE];
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-muted">Cor</legend>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <label key={color} className="relative cursor-pointer">
            <input type="radio" name={name} value={color} defaultChecked={color === defaultValue} className="peer sr-only" />
            <span className="block size-7 rounded-full ring-offset-2 ring-offset-[var(--surface)] transition peer-checked:ring-2 peer-checked:ring-[var(--fg)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary)]" style={{ backgroundColor: color }} />
            <span className="sr-only">{color}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function IconPicker({ name = "icon", defaultValue = "Tag" }: { name?: string; defaultValue?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-muted">Ícone</legend>
      <div className="grid grid-cols-8 gap-1.5">
        {CATEGORY_ICONS.map((icon) => (
          <label key={icon} className="cursor-pointer">
            <input type="radio" name={name} value={icon} defaultChecked={icon === defaultValue} className="peer sr-only" />
            <span className="flex aspect-square items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-2 peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary)]">
              <CategoryIcon name={icon} />
            </span>
            <span className="sr-only">{icon}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
