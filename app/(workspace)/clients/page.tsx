const clients = [
  { name: "Astra Retail", initials: "AR", color: "bg-orange-500", platforms: ["IG", "FB", "YT"], posts: 42 },
  { name: "Zenith Foods", initials: "ZF", color: "bg-sky-500", platforms: ["IG", "LI", "TW"], posts: 31 },
  { name: "Nova Hotels", initials: "NH", color: "bg-red-500", platforms: ["FB", "YT", "LI"], posts: 24 },
  { name: "Pulse Fitness", initials: "PF", color: "bg-purple-500", platforms: ["IG", "FB", "TW"], posts: 37 },
  { name: "Capital Homes", initials: "CH", color: "bg-indigo-500", platforms: ["IG", "LI", "YT"], posts: 29 },
  { name: "Urban Loom", initials: "UL", color: "bg-pink-500", platforms: ["IG", "FB"], posts: 18 },
];

const platformBadge: Record<string, string> = {
  IG: "bg-orange-500/20 text-orange-300 border-orange-400/20",
  FB: "bg-blue-500/20 text-blue-300 border-blue-400/20",
  YT: "bg-red-500/20 text-red-300 border-red-400/20",
  LI: "bg-blue-500/20 text-sky-300 border-sky-400/20",
  TW: "bg-purple-500/20 text-purple-300 border-purple-400/20",
};

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-2 text-sm text-violet-100/75">Manage client portfolios and monthly social output.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
          <article key={client.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white ${client.color}`}>
                {client.initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{client.name}</h2>
                <p className="text-xs text-violet-100/65">{client.posts} posts this month</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {client.platforms.map((platform) => (
                <span
                  key={platform}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${platformBadge[platform]}`}
                >
                  {platform}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
