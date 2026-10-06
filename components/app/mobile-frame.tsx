import { cn } from "@/lib/utils";

/** Coluna de celular: ocupa a tela no mobile, centralizada (~430px) no desktop. */
export function MobileFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[#dfe5e2]">
      <div className={cn("relative flex min-h-dvh w-full max-w-[430px] flex-col shadow-xl", className)}>
        {children}
      </div>
    </div>
  );
}
