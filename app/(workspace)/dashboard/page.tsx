const metrics = [
  { label: "Active Clients", value: "48", change: "+6 this month" },
  { label: "Posts Scheduled", value: "386", change: "+14% vs last month" },
  { label: "Pending Approvals", value: "27", change: "8 urgent" },
  { label: "Platforms Connected", value: "5", change: "Instagram, FB, YT, LI, TW" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-violet-100/80">Overview of campaigns, approvals, and publishing performance.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-violet-100/70">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p className="mt-2 text-xs text-violet-200/70">{metric.change}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
