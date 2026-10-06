"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Estado = { ok?: boolean; erro?: string } | undefined;

/** <form> com useActionState + toasts de sucesso/erro. */
export function ActionForm({
  action,
  sucesso,
  children,
  className,
  onOk,
}: {
  action: (s: Estado, fd: FormData) => Promise<Estado>;
  sucesso?: string;
  children: React.ReactNode | ((pending: boolean) => React.ReactNode);
  className?: string;
  onOk?: () => void;
}) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  useEffect(() => {
    if (state?.ok) {
      if (sucesso) toast.success(sucesso);
      onOk?.();
    }
    if (state?.erro) toast.error(state.erro);
  }, [state, sucesso, onOk]);
  return (
    <form action={dispatch} className={className}>
      {typeof children === "function" ? children(pending) : children}
    </form>
  );
}

/** Botão de envio com estado "salvando" — usável a partir de Server Components. */
export function SubmitButton({
  children,
  pendente = "Salvando...",
  ...props
}: React.ComponentProps<typeof Button> & { pendente?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendente : children}
    </Button>
  );
}
