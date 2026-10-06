import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Campo({
  name,
  label,
  erro,
  className,
  obrigatorio,
  ...props
}: React.ComponentProps<"input"> & {
  name: string;
  label: string;
  erro?: string;
  obrigatorio?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>
        {label}
        {obrigatorio && <span className="text-danger-600">*</span>}
      </Label>
      <Input id={name} name={name} aria-invalid={!!erro} className="h-9 bg-white" {...props} />
      {erro && <p className="text-xs text-danger-600">{erro}</p>}
    </div>
  );
}

export function CampoSelect({
  name,
  label,
  defaultValue,
  opcoes,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  opcoes: [string, string][];
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {opcoes.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold tracking-wide text-brand-700 uppercase">{titulo}</legend>
      {children}
    </fieldset>
  );
}
