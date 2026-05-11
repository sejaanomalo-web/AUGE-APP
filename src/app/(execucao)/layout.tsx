export default function ExecucaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bg-base">{children}</div>;
}
