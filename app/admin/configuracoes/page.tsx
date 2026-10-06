import { salvarConfiguracao } from "@/app/actions/admin/geral";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Campo, Secao } from "@/components/admin/campo";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/session";
import { bpParaInput, centavosParaInput } from "@/lib/parse";
import { obterConfiguracao } from "@/lib/services/cobrancas-admin";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireAdmin(["admin"]);
  const c = await obterConfiguracao();
  return (
    <>
      <PageHeader titulo="Configurações" descricao="Valores usados nas próximas emissões de cobrança." />
      <Panel className="max-w-3xl p-8">
        <ActionForm action={salvarConfiguracao} sucesso="Configurações salvas" className="space-y-8">
          <Secao titulo="Taxa de irrigação">
            <div className="grid grid-cols-3 gap-4">
              <Campo
                name="valorHa"
                label="Valor por hectare (R$)"
                inputMode="decimal"
                defaultValue={centavosParaInput(c.valorHaCentavos)}
              />
              <Campo
                name="diaVencimentoPadrao"
                label="Dia de vencimento padrão"
                type="number"
                min={1}
                max={31}
                defaultValue={c.diaVencimentoPadrao}
              />
            </div>
          </Secao>
          <Secao titulo="Encargos por atraso">
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Regra ainda não definida pela cooperativa. Com 0%, nenhuma multa ou juros é cobrado. Mudanças valem apenas
              para cobranças emitidas depois.
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Campo name="multa" label="Multa (%)" inputMode="decimal" defaultValue={bpParaInput(c.multaBp)} />
              <Campo
                name="juros"
                label="Juros ao mês (%)"
                inputMode="decimal"
                defaultValue={bpParaInput(c.jurosMesBp)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="jurosProRata"
                defaultChecked={c.jurosProRata}
                className="size-4 accent-brand-600"
              />
              Juros proporcionais aos dias de atraso (pro rata). Desmarcado: cobra mês cheio.
            </label>
          </Secao>
          <Secao titulo="Dados da cooperativa">
            <div className="grid grid-cols-2 gap-4">
              <Campo name="coopNome" label="Razão social" defaultValue={c.coopNome} className="col-span-2" />
              <Campo name="coopCnpj" label="CNPJ" defaultValue={c.coopCnpj ?? ""} />
              <Campo name="coopTelefone" label="Telefone" defaultValue={c.coopTelefone ?? ""} />
              <Campo name="coopEndereco" label="Endereço" defaultValue={c.coopEndereco ?? ""} className="col-span-2" />
            </div>
          </Secao>
          <SubmitButton size="lg">Salvar configurações</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}
