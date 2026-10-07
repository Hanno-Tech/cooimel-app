import { cn } from "@/lib/utils";

/**
 * Coluna de celular: ocupa a tela no mobile, centralizada (~430px) em telas maiores.
 * Com `desktop`, a partir de lg (1024px) libera a largura total (app com menu lateral).
 */
export function MobileFrame({
  children,
  className,
  desktop = false,
}: {
  children: React.ReactNode;
  className?: string;
  desktop?: boolean;
}) {
  return (
    <div className={cn("flex min-h-dvh justify-center bg-[#dfe5e2]", desktop && "lg:block lg:bg-app-bg")}>
      <div
        className={cn(
          "relative flex min-h-dvh w-full max-w-[430px] flex-col shadow-xl",
          desktop && "lg:max-w-none lg:shadow-none",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
