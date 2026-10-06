"use client";

import { useMemo, useState } from "react";
import { gerarLote } from "@/app/actions/admin/cobrancas";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatHa, formatMoeda } from "@/lib/format";
import type { ItemPrevia } from "@/lib/services/cobrancas-admin";
import { ActionForm } from "./action-form";

export function GerarLoteForm({
  itens,
  competencia,
  vencimento,
  valorHa,
  descricao,
}: {
  itens: ItemPrevia[];
  competencia: string;
  vencimento: string;
  valorHa: string;
  descricao: string;
}) {
  const disponiveis = itens.filter((i) => !i.jaExiste);
  const [sel, setSel] = useState(() => new Set(disponiveis.map((i) => i.propriedadeId)));
  const total = useMemo(
    () => itens.filter((i) => sel.has(i.propriedadeId)).reduce((s, i) => s + i.valorCentavos, 0),
    [itens, sel],
  );
  const alternar = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <ActionForm action={gerarLote}>
      {(pending) => (
        <>
          <input type="hidden" name="competencia" value={competencia} />
          <input type="hidden" name="vencimento" value={vencimento} />
          <input type="hidden" name="valorHa" value={valorHa} />
          <input type="hidden" name="descricao" value={descricao} />
          {[...sel].map((id) => (
            <input key={id} type="hidden" name="propriedadeId" value={id} />
          ))}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-5">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-600"
                    checked={sel.size === disponiveis.length && disponiveis.length > 0}
                    onChange={(e) =>
                      setSel(e.target.checked ? new Set(disponiveis.map((i) => i.propriedadeId)) : new Set())
                    }
                    aria-label="Selecionar todas"
                  />
                </TableHead>
                <TableHead>Associado</TableHead>
                <TableHead>Propriedade</TableHead>
                <TableHead className="text-right">Área irrigada</TableHead>
                <TableHead className="pr-5 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((i) => (
                <TableRow key={i.propriedadeId} className={i.jaExiste ? "opacity-50" : ""}>
                  <TableCell className="pl-5">
                    <input
                      type="checkbox"
                      className="size-4 accent-brand-600"
                      disabled={i.jaExiste}
                      checked={sel.has(i.propriedadeId)}
                      onChange={() => alternar(i.propriedadeId)}
                    />
                  </TableCell>
                  <TableCell>
                    {i.associado} <span className="text-xs text-ink-muted">({i.matricula})</span>
                  </TableCell>
                  <TableCell>
                    {i.propriedade}
                    {i.jaExiste && <span className="ml-2 text-xs text-ink-muted">já emitida</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatHa(i.areaIrrigadaHa)}</TableCell>
                  <TableCell className="pr-5 text-right tabular-nums">{formatMoeda(i.valorCentavos)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-5 py-4">
            <div className="text-sm">
              <strong>{sel.size}</strong> cobrança(s) · Total <strong className="text-brand-700">{formatMoeda(total)}</strong>
            </div>
            <Button type="submit" size="lg" disabled={pending || sel.size === 0}>
              {pending ? "Gerando..." : `Gerar ${sel.size} cobrança(s)`}
            </Button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
