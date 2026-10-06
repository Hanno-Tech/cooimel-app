export function PageHeader({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-ink-muted">{descricao}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-white shadow-sm ${className}`}>{children}</div>;
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-12 text-center text-sm text-ink-muted">{children}</div>;
}
