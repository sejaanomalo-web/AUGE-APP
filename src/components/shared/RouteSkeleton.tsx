// Skeleton neutro (cabeçalho + lista) usado como fallback de loading.tsx por
// grupo de rota. Faz a navegação commitar na hora mostrando a estrutura,
// enquanto o conteúdo real streama, em vez de congelar a tela anterior.
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-bg-elevated ${className}`} />;
}

export function RouteSkeleton() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4" aria-hidden>
      <div className="flex flex-col gap-2 mb-2">
        <Block className="h-7 w-2/5 max-w-xs" />
        <Block className="h-4 w-3/5 max-w-sm" />
      </div>
      <Block className="h-16" />
      <Block className="h-16" />
      <Block className="h-16" />
      <Block className="h-16" />
    </div>
  );
}
