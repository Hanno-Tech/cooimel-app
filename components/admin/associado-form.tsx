"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  atualizarAssociado,
  criarAssociado,
  salvarFoto,
  type ActionState,
} from "@/app/actions/admin/associados";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Campo, CampoSelect, Secao } from "./campo";
import { FotoPicker } from "./foto-picker";

type Associado = {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  rg: string | null;
  dataNascimento: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  dataAdmissao: string | null;
  situacao: "ativo" | "inativo" | "suspenso";
  observacoes: string | null;
};

const mascaras = {
  cpf: (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
  tel: (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  },
  cep: (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2"),
};

function onMask(fn: (v: string) => string) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = fn(e.target.value);
  };
}

export function SenhaGeradaDialog({
  senha,
  onClose,
  nome,
}: {
  senha: string | null;
  onClose: () => void;
  nome?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Dialog open={!!senha} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-brand-600" /> Senha provisória
          </DialogTitle>
          <DialogDescription>
            Entregue esta senha {nome ? `a ${nome}` : "ao associado"}. Ela será exibida apenas agora e
            deverá ser trocada no primeiro acesso.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-brand-500 bg-brand-50 px-4 py-3">
          <code className="text-2xl font-bold tracking-widest text-brand-900">{senha}</code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(senha ?? "");
              setCopiado(true);
            }}
          >
            {copiado ? <Check /> : <Copy />} {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SenhaInicialCampos({ erro }: { erro?: string }) {
  const [gerar, setGerar] = useState(true);
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="gerarSenha"
          checked={gerar}
          onChange={(e) => setGerar(e.target.checked)}
          className="size-4 accent-brand-600"
        />
        Gerar senha provisória automaticamente
      </label>
      {!gerar && (
        <Campo
          name="senha"
          label="Senha inicial"
          type="text"
          autoComplete="off"
          erro={erro}
          placeholder="mín. 8 caracteres, letras e números"
        />
      )}
      <p className="text-xs text-ink-muted">O associado será obrigado a trocar a senha no primeiro acesso.</p>
    </div>
  );
}

export function AssociadoForm({
  associado,
  sugestaoMatricula,
  fotoUrl,
}: {
  associado?: Associado;
  sugestaoMatricula?: string;
  fotoUrl?: string | null;
}) {
  const editar = !!associado;
  const router = useRouter();
  const [senha, setSenha] = useState<string | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await (editar ? atualizarAssociado : criarAssociado)(prev, fd);
    if (r?.ok && editar) toast.success("Cadastro atualizado");
    if (r?.senhaGerada) setSenha(r.senhaGerada);
    if (r?.erro) toast.error(r.erro);
    return r;
  }, undefined);
  const foto = useRef<Blob | null>(null);
  const [fotoPending, startFoto] = useTransition();
  const e = state?.campos ?? {};
  const a = associado;

  const enviarFotoEdicao = (blob: Blob | null) => {
    if (!a) return;
    const fd = new FormData();
    fd.set("id", a.id);
    if (blob) fd.set("foto", blob, "foto.webp");
    else fd.set("remover", "1");
    startFoto(async () => {
      const r = await salvarFoto(undefined, fd);
      if (r?.erro) toast.error(r.erro);
      else toast.success(blob ? "Foto atualizada" : "Foto removida");
      router.refresh();
    });
  };

  return (
    <>
      <form
        action={(fd) => {
          if (!editar && foto.current) fd.set("foto", foto.current, "foto.webp");
          return action(fd);
        }}
        className="grid grid-cols-[220px_1fr] gap-10"
      >
        {a && <input type="hidden" name="id" value={a.id} />}
        <div className="pt-2">
          <FotoPicker
            urlAtual={fotoUrl ?? null}
            disabled={fotoPending}
            onChange={(b) => (editar ? enviarFotoEdicao(b) : (foto.current = b))}
            onRemover={() => (editar ? enviarFotoEdicao(null) : (foto.current = null))}
          />
          <p className="mt-3 text-center text-xs text-ink-muted">
            Exibida no app do associado (Meu Cadastro).
          </p>
        </div>

        <div className="max-w-3xl space-y-8">
          <Secao titulo="Dados pessoais">
            <div className="grid grid-cols-6 gap-4">
              <Campo name="nome" label="Nome completo" obrigatorio defaultValue={a?.nome} erro={e.nome} className="col-span-4" />
              <Campo
                name="matricula"
                label="Matrícula"
                obrigatorio
                defaultValue={a?.matricula ?? sugestaoMatricula}
                erro={e.matricula}
                className="col-span-2"
              />
              <Campo
                name="cpf"
                label="CPF"
                obrigatorio
                inputMode="numeric"
                defaultValue={a ? mascaras.cpf(a.cpf) : ""}
                onChange={onMask(mascaras.cpf)}
                erro={e.cpf}
                className="col-span-2"
              />
              <Campo name="rg" label="RG" defaultValue={a?.rg ?? ""} className="col-span-2" />
              <Campo
                name="dataNascimento"
                label="Data de nascimento"
                type="date"
                defaultValue={a?.dataNascimento ?? ""}
                className="col-span-2"
              />
            </div>
          </Secao>

          <Secao titulo="Contato">
            <div className="grid grid-cols-6 gap-4">
              <Campo
                name="telefone"
                label="Telefone / WhatsApp"
                inputMode="tel"
                defaultValue={a?.telefone ? mascaras.tel(a.telefone) : ""}
                onChange={onMask(mascaras.tel)}
                className="col-span-2"
              />
              <Campo name="email" label="E-mail" type="email" defaultValue={a?.email ?? ""} erro={e.email} className="col-span-4" />
            </div>
          </Secao>

          <Secao titulo="Endereço">
            <div className="grid grid-cols-6 gap-4">
              <Campo
                name="cep"
                label="CEP"
                inputMode="numeric"
                defaultValue={a?.cep ? mascaras.cep(a.cep) : ""}
                onChange={onMask(mascaras.cep)}
                className="col-span-2"
              />
              <Campo name="logradouro" label="Logradouro" defaultValue={a?.logradouro ?? ""} className="col-span-3" />
              <Campo name="numero" label="Número" defaultValue={a?.numero ?? ""} className="col-span-1" />
              <Campo name="bairro" label="Bairro / Localidade" defaultValue={a?.bairro ?? ""} className="col-span-2" />
              <Campo name="cidade" label="Cidade" defaultValue={a?.cidade ?? "Meleiro"} className="col-span-3" />
              <Campo name="uf" label="UF" maxLength={2} defaultValue={a?.uf ?? "SC"} className="col-span-1" />
            </div>
          </Secao>

          <Secao titulo="Cooperativa">
            <div className="grid grid-cols-6 gap-4">
              <Campo
                name="dataAdmissao"
                label="Data de admissão"
                type="date"
                defaultValue={a?.dataAdmissao ?? ""}
                className="col-span-2"
              />
              <CampoSelect
                name="situacao"
                label="Situação"
                defaultValue={a?.situacao ?? "ativo"}
                opcoes={[
                  ["ativo", "Ativo"],
                  ["suspenso", "Suspenso"],
                  ["inativo", "Inativo (bloqueia acesso)"],
                ]}
                className="col-span-2"
              />
              <div className="col-span-6 space-y-1.5">
                <Label htmlFor="observacoes">Observações internas</Label>
                <Textarea id="observacoes" name="observacoes" defaultValue={a?.observacoes ?? ""} className="bg-white" rows={3} />
              </div>
            </div>
          </Secao>

          {!editar && (
            <Secao titulo="Acesso ao app">
              <SenhaInicialCampos erro={e.senha} />
            </Secao>
          )}

          {state?.erro && !Object.keys(e).length && <p className="text-sm text-danger-600">{state.erro}</p>}

          <div className="flex gap-3 border-t pt-6">
            <Button type="submit" size="lg" disabled={pending} className="px-6">
              {pending ? "Salvando..." : editar ? "Salvar alterações" : "Cadastrar associado"}
            </Button>
            {!editar && (
              <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </form>

      <SenhaGeradaDialog
        senha={senha}
        onClose={() => {
          setSenha(null);
          if (!editar && state?.id) router.push(`/admin/associados/${state.id}?tab=propriedades`);
        }}
      />
    </>
  );
}
