"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { removerPropriedade, salvarPropriedade, type ActionState } from "@/app/actions/admin/associados";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatHa } from "@/lib/format";
import { Campo } from "./campo";

type Prop = {
  id: string;
  nome: string;
  localidade: string | null;
  car: string | null;
  canal: string | null;
  areaCadastradaHa: string;
  areaIrrigadaHa: string;
  ativa: boolean;
};

const ha = (v: string) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

function PropriedadeDialog({
  associadoId,
  prop,
  open,
  onOpenChange,
}: {
  associadoId: string;
  prop: Prop | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(salvarPropriedade, undefined);
  const e = state?.campos ?? {};
  useEffect(() => {
    if (state?.ok) {
      toast.success("Propriedade salva");
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{prop ? "Editar propriedade" : "Nova propriedade"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="grid grid-cols-2 gap-4" key={prop?.id ?? "nova"}>
          <input type="hidden" name="associadoId" value={associadoId} />
          {prop && <input type="hidden" name="id" value={prop.id} />}
          <Campo name="nome" label="Nome" obrigatorio placeholder="Ex.: Fazenda São João" defaultValue={prop?.nome} erro={e.nome} className="col-span-2" />
          <Campo name="localidade" label="Localidade" defaultValue={prop?.localidade ?? ""} />
          <Campo name="canal" label="Canal / setor" defaultValue={prop?.canal ?? ""} />
          <Campo name="car" label="CAR / matrícula do imóvel" defaultValue={prop?.car ?? ""} className="col-span-2" />
          <Campo
            name="areaCadastradaHa"
            label="Área cadastrada (ha)"
            obrigatorio
            inputMode="decimal"
            placeholder="18,50"
            defaultValue={prop ? ha(prop.areaCadastradaHa) : ""}
            erro={e.areaCadastradaHa}
          />
          <Campo
            name="areaIrrigadaHa"
            label="Área irrigada (ha)"
            obrigatorio
            inputMode="decimal"
            placeholder="16,00"
            defaultValue={prop ? ha(prop.areaIrrigadaHa) : ""}
            erro={e.areaIrrigadaHa}
          />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativa" defaultChecked={prop?.ativa ?? true} className="size-4 accent-brand-600" />
            Propriedade ativa (entra na geração de cobranças)
          </label>
          <p className="col-span-2 text-xs text-ink-muted">
            A cobrança usa a <strong>área irrigada</strong>. Alterações não afetam cobranças já emitidas.
          </p>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Propriedades({ associadoId, props }: { associadoId: string; props: Prop[] }) {
  const [editando, setEditando] = useState<Prop | null>(null);
  const [open, setOpen] = useState(false);
  const ativas = props.filter((p) => p.ativa);
  const total = (k: "areaCadastradaHa" | "areaIrrigadaHa") => ativas.reduce((s, p) => s + Number(p[k]), 0);

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm text-ink-muted">
          {ativas.length} ativa(s) · {formatHa(total("areaCadastradaHa"))} cadastrados ·{" "}
          <strong className="text-brand-700">{formatHa(total("areaIrrigadaHa"))} irrigados</strong>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            setOpen(true);
          }}
        >
          <Plus /> Adicionar propriedade
        </Button>
      </div>
      {props.length === 0 ? (
        <div className="border-t px-6 py-12 text-center text-sm text-ink-muted">
          Nenhuma propriedade. Adicione ao menos uma para gerar cobranças.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Nome</TableHead>
              <TableHead>Localidade</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Cadastrada</TableHead>
              <TableHead className="text-right">Irrigada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.map((p) => (
              <TableRow key={p.id} className={p.ativa ? "" : "opacity-50"}>
                <TableCell className="pl-5 font-medium">{p.nome}</TableCell>
                <TableCell>{p.localidade ?? "—"}</TableCell>
                <TableCell>{p.canal ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatHa(p.areaCadastradaHa)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatHa(p.areaIrrigadaHa)}</TableCell>
                <TableCell>{p.ativa ? "Ativa" : "Inativa"}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar"
                    onClick={() => {
                      setEditando(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <form
                    action={removerPropriedade}
                    className="inline"
                    onSubmit={(ev) => {
                      if (!confirm(`Remover "${p.nome}"? Se houver cobranças, ela será apenas desativada.`)) ev.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="associadoId" value={associadoId} />
                    <Button variant="ghost" size="icon-sm" aria-label="Remover">
                      <Trash2 className="text-danger-600" />
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <PropriedadeDialog associadoId={associadoId} prop={editando} open={open} onOpenChange={setOpen} />
    </div>
  );
}
