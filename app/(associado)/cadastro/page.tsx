import { CircleUserRound, Info, MapPinned } from "lucide-react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app/shell";
import { AppCard, Page } from "@/components/app/ui";
import { requireAssociado } from "@/lib/auth/session";
import { formatHa, formatTelefone, mascararCpf } from "@/lib/format";
import { propriedadesDoAssociado } from "@/lib/services/app";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Meu cadastro" };

function Linha({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-black/5 py-2.5 text-sm last:border-0">
      <span className="font-medium text-ink">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function Aviso() {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
      <Info className="mt-0.5 size-4 shrink-0" />
      Alguns dados podem ser somente visualizados, para sua segurança.
    </div>
  );
}

// Tela 10 — Meu cadastro
export default async function CadastroPage() {
  const { associado } = await requireAssociado();
  const props = await propriedadesDoAssociado(associado.id);
  const ativas = props.filter((p) => p.ativa);
  const fotoVersao = associado.fotoKey?.split("/").pop();

  return (
    <>
      <AppHeader title="Meu Cadastro" back="/inicio" />
      <Page largura={ativas.length > 1 ? "ampla" : "estreita"}>
        <div
          className={cn("flex flex-col gap-3 lg:grid lg:items-start lg:gap-6", ativas.length > 1 && "lg:grid-cols-2")}
        >
          <div className="flex flex-col gap-3">
            <AppCard className="p-4 lg:p-6">
              <div className="flex items-center gap-4 pb-3">
                {associado.fotoKey ? (
                  // eslint-disable-next-line @next/next/no-img-element -- rota privada autenticada
                  <img
                    src={`/fotos/${associado.id}?v=${fotoVersao}`}
                    alt={associado.nome}
                    className="size-16 rounded-full object-cover ring-2 ring-brand-50"
                  />
                ) : (
                  <CircleUserRound className="size-16 text-brand-900" strokeWidth={1.4} />
                )}
                <div>
                  <p className="text-xl font-medium text-ink">{associado.nome}</p>
                  <p className="text-sm text-ink-muted">Matrícula: {associado.matricula}</p>
                </div>
              </div>
              <Linha label="CPF" value={mascararCpf(associado.cpf)} />
              <Linha label="Telefone" value={formatTelefone(associado.telefone)} />
              {associado.email && <Linha label="E-mail" value={associado.email} />}
              {ativas.length === 1 && (
                <>
                  <Linha label="Propriedade" value={ativas[0].nome} />
                  <Linha label="Área cadastrada" value={formatHa(ativas[0].areaCadastradaHa)} />
                  <Linha label="Área irrigada" value={formatHa(ativas[0].areaIrrigadaHa)} />
                </>
              )}
            </AppCard>
            <Aviso />
          </div>

          {ativas.length > 1 && (
            <div className="flex flex-col gap-3">
              <h2 className="px-1 pt-1 text-sm font-medium text-ink lg:pt-0 lg:text-base">
                Propriedades ({ativas.length})
              </h2>
              {ativas.map((p) => (
                <AppCard key={p.id} className="p-4">
                  <p className="flex items-center gap-2 font-medium text-ink">
                    <MapPinned className="size-4 text-brand-700" /> {p.nome}
                  </p>
                  {p.localidade && <p className="text-xs text-ink-muted">{p.localidade}</p>}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-app-bg px-3 py-2">
                      <p className="text-xs text-ink-muted">Área cadastrada</p>
                      <p className="font-medium text-ink">{formatHa(p.areaCadastradaHa)}</p>
                    </div>
                    <div className="rounded-lg bg-app-bg px-3 py-2">
                      <p className="text-xs text-ink-muted">Área irrigada</p>
                      <p className="font-medium text-ink">{formatHa(p.areaIrrigadaHa)}</p>
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>
          )}
        </div>
      </Page>
    </>
  );
}
