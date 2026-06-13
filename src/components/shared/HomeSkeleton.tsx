// Skeleton genérico das home pages, usado como fallback dos loading.tsx.
// Mostra a estrutura (saudação + cards + bloco principal) enquanto o conteúdo
// real streama, para a navegação commitar na hora em vez de congelar a tela.
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-bg-elevated ${className}`} />;
}

export function HomeSkeleton({
  maxWidth = "max-w-5xl",
}: {
  maxWidth?: string;
}) {
  return (
    <div className={`${maxWidth} mx-auto flex flex-col gap-6`} aria-hidden>
      <div className="flex flex-col gap-2">
        <Block className="h-3 w-24" />
        <Block className="h-9 w-3/4 max-w-sm" />
        <Block className="h-4 w-1/2 max-w-xs" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Block className="h-24" />
        <Block className="h-24" />
        <Block className="h-24" />
        <Block className="h-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Block className="h-64 lg:col-span-2" />
        <Block className="h-64" />
      </div>
    </div>
  );
}
