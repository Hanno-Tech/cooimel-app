"use client";

import { useState } from "react";
import { baixaManual, cancelarCobranca } from "@/app/actions/admin/cobrancas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "./action-form";
import { Campo } from "./campo";

export function CobrancaAcoes({ id, valorSugerido, hoje }: { id: string; valorSugerido: string; hoje: string }) {
  const [aberto, setAberto] = useState<"baixa" | "cancelar" | null>(null);
  const fechar = () => setAberto(null);
  return (
    <div className="flex gap-2">
      <Button onClick={() => setAberto("baixa")}>Registrar pagamento manual</Button>
      <Button variant="destructive" onClick={() => setAberto("cancelar")}>
        Cancelar cobrança
      </Button>

      <Dialog open={aberto === "baixa"} onOpenChange={(o) => !o && fechar()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baixa manual</DialogTitle>
          </DialogHeader>
          <ActionForm action={baixaManual} sucesso="Pagamento registrado" onOk={fechar} className="space-y-4">
            {(pending) => (
              <>
                <input type="hidden" name="id" value={id} />
                <div className="grid grid-cols-2 gap-4">
                  <Campo name="valor" label="Valor recebido (R$)" defaultValue={valorSugerido} inputMode="decimal" required />
                  <Campo name="data" label="Data do pagamento" type="date" defaultValue={hoje} max={hoje} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="observacao">Como foi recebido</Label>
                  <Textarea id="observacao" name="observacao" placeholder="Ex.: dinheiro no caixa da cooperativa" required />
                </div>
                <p className="text-xs text-ink-muted">Boletos/Pix ativos desta cobrança serão cancelados.</p>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fechar}>
                    Voltar
                  </Button>
                  <Button disabled={pending}>{pending ? "Salvando..." : "Confirmar baixa"}</Button>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>

      <Dialog open={aberto === "cancelar"} onOpenChange={(o) => !o && fechar()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cobrança</DialogTitle>
          </DialogHeader>
          <ActionForm action={cancelarCobranca} sucesso="Cobrança cancelada" onOk={fechar} className="space-y-4">
            {(pending) => (
              <>
                <input type="hidden" name="id" value={id} />
                <div className="space-y-1.5">
                  <Label htmlFor="motivo">Motivo</Label>
                  <Textarea id="motivo" name="motivo" placeholder="Ex.: área irrigada informada errada" required />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fechar}>
                    Voltar
                  </Button>
                  <Button variant="destructive" disabled={pending}>
                    {pending ? "Cancelando..." : "Cancelar cobrança"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </div>
  );
}
