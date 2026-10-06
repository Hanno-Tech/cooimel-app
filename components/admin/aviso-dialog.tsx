"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { salvarAviso } from "@/app/actions/admin/geral";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "./action-form";
import { Campo, CampoSelect } from "./campo";

export type AvisoForm = {
  id: string;
  tipo: "manutencao" | "assembleia" | "orientacao";
  titulo: string;
  resumo: string;
  corpo: string | null;
  dataEvento: string; // yyyy-MM-ddTHH:mm local
  local: string | null;
  publicado: boolean;
};

export function AvisoDialog({ aviso }: { aviso?: AvisoForm }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {aviso ? (
        <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setOpen(true)}>
          <Pencil />
        </Button>
      ) : (
        <Button size="lg" onClick={() => setOpen(true)}>
          <Plus /> Novo aviso
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{aviso ? "Editar aviso" : "Novo aviso"}</DialogTitle>
          </DialogHeader>
          <ActionForm action={salvarAviso} sucesso="Aviso salvo" onOk={() => setOpen(false)} className="grid grid-cols-2 gap-4">
            {(pending) => (
              <>
                {aviso && <input type="hidden" name="id" value={aviso.id} />}
                <CampoSelect
                  name="tipo"
                  label="Tipo"
                  defaultValue={aviso?.tipo ?? "manutencao"}
                  opcoes={[
                    ["manutencao", "Manutenção (vermelho)"],
                    ["assembleia", "Assembleia / reunião (verde)"],
                    ["orientacao", "Orientação (azul)"],
                  ]}
                />
                <Campo name="dataEvento" label="Data do evento" type="datetime-local" defaultValue={aviso?.dataEvento ?? ""} />
                <Campo name="titulo" label="Título" defaultValue={aviso?.titulo} className="col-span-2" required />
                <Campo name="local" label="Local" defaultValue={aviso?.local ?? ""} className="col-span-2" placeholder="Ex.: Salão da Comunidade - Meleiro/SC" />
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="resumo">Resumo (aparece na lista)</Label>
                  <Textarea id="resumo" name="resumo" maxLength={200} rows={2} defaultValue={aviso?.resumo} required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="corpo">Texto completo</Label>
                  <Textarea id="corpo" name="corpo" rows={5} defaultValue={aviso?.corpo ?? ""} />
                </div>
                <label className="col-span-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="publicar" defaultChecked={aviso?.publicado ?? true} className="size-4 accent-brand-600" />
                  Publicado (visível no app)
                </label>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
