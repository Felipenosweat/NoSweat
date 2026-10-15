// Os três registros de DNS que o produto pede para o domínio próprio (ver server/domains):
// A e CNAME apontam para a Vercel; o TXT `_nosweat` prova que o domínio é do cliente
// (server/domains/verify.ts). O código de verificação aqui é de exemplo.

const RECORDS = [
  { type: "A", name: "@", value: "76.76.21.21" },
  { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
  { type: "TXT", name: "_nosweat", value: "nosweat-verify=3f7a9c1e…" },
];

export function DnsRecords() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-ink shadow-[0_20px_40px_-20px_rgb(7_27_51/.35)] sm:p-4">
      <p className="text-sm font-semibold">Add these at your domain company</p>
      <table className="mt-2 w-full text-left font-mono text-[11px] sm:text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="pb-1 font-normal">Type</th>
            <th className="pb-1 font-normal">Name</th>
            <th className="pb-1 font-normal">Value</th>
          </tr>
        </thead>
        <tbody>
          {RECORDS.map((record) => (
            <tr key={record.type} className="border-t border-slate-200">
              <td className="py-1 pr-2 align-top">{record.type}</td>
              <td className="py-1 pr-2 align-top">{record.name}</td>
              <td className="py-1 align-top break-all">{record.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
