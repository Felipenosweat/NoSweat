import type { DnsProvider } from "@nosweat/schema";

// Passo a passo para criar os registros de DNS em cada empresa de domínio. Os nomes dos botões
// seguem o painel de cada uma; se algum mudar, é só atualizar aqui.

export type DnsGuideId = DnsProvider | "other";

export type DnsGuide = {
  id: DnsGuideId;
  name: string;
  /** Link direto para a tela de DNS (com o domínio, quando a empresa permite). */
  dnsUrl: (domain: string) => string | null;
  /** Artigo oficial de ajuda da empresa. */
  helpUrl: string | null;
  /** Como a empresa chama os campos "Name" e "Value" no formulário. */
  fields: { name: string; value: string };
  /** O "@" (o próprio domínio) é digitado como "@" ou deixado em branco? */
  rootName: "@" | "blank";
  steps: string[];
  /** Avisos que evitam o erro mais comum nesta empresa. */
  tips: string[];
};

const enc = encodeURIComponent;

export const DNS_GUIDES: DnsGuide[] = [
  {
    id: "godaddy",
    name: "GoDaddy",
    dnsUrl: (domain) => `https://dcc.godaddy.com/control/portfolio/${enc(domain)}/settings?tab=dns`,
    helpUrl: "https://www.godaddy.com/help/manage-dns-records-680",
    fields: { name: "Name", value: "Value" },
    rootName: "@",
    steps: [
      "Sign in to GoDaddy and go to My Products.",
      "Next to your domain, click DNS.",
      "Click Add New Record. Pick the Type, then paste the Name and Value from the table above. Leave TTL as it is and click Save.",
      "Repeat for each record in the table.",
    ],
    tips: [
      "If there's already an A record named “@” (often called Parked), click the pencil to edit it and paste our value instead of adding a new one.",
      "Same for the CNAME named “www”: edit it instead of adding another.",
      "If Forwarding is turned on for your domain, turn it off.",
    ],
  },
  {
    id: "namecheap",
    name: "Namecheap",
    dnsUrl: (domain) =>
      `https://ap.www.namecheap.com/Domains/DomainControlPanel/${enc(domain)}/advancedns`,
    helpUrl: null,
    fields: { name: "Host", value: "Value" },
    rootName: "@",
    steps: [
      "Sign in to Namecheap and open Domain List.",
      "Click Manage next to your domain, then open the Advanced DNS tab.",
      "Under Host Records, click Add New Record. Pick the Type, paste the Name into Host and the Value into Value, then click the green check mark.",
      "Repeat for each record in the table.",
    ],
    tips: [
      "Delete the “URL Redirect Record” and the CNAME “www” that points to parkingpage.namecheap.com, if you see them.",
      "Nameservers must be set to Namecheap BasicDNS (Domain tab) for these records to work.",
    ],
  },
  {
    id: "squarespace",
    name: "Squarespace (ex Google Domains)",
    dnsUrl: (domain) =>
      `https://account.squarespace.com/domains/managed/${enc(domain)}/dns/dns-settings`,
    helpUrl: null,
    fields: { name: "Host", value: "Data" },
    rootName: "@",
    steps: [
      "Sign in at account.squarespace.com and open Domains.",
      "Click your domain, then DNS → DNS Settings.",
      "Under Custom records, click Add record. Pick the Type, paste the Name into Host and the Value into Data, then click Save.",
      "Repeat for each record in the table.",
    ],
    tips: [
      "If you see a “Squarespace Defaults” preset, delete it (trash icon). Keep any email records (MX).",
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    dnsUrl: () => "https://dash.cloudflare.com/",
    helpUrl: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/",
    fields: { name: "Name", value: "IPv4 address / Target / Content" },
    rootName: "@",
    steps: [
      "Sign in to Cloudflare and click your domain.",
      "Open DNS → Records and click Add record.",
      "Pick the Type, paste the Name and the Value (Cloudflare calls it IPv4 address, Target or Content).",
      "Important: click the orange cloud so it turns gray (“DNS only”), then click Save.",
      "Repeat for each record in the table.",
    ],
    tips: [
      "The cloud must be gray (DNS only) on the A and CNAME records, or your secure certificate won't work.",
    ],
  },
  {
    id: "hostinger",
    name: "Hostinger",
    dnsUrl: () => "https://hpanel.hostinger.com/domains",
    helpUrl: null,
    fields: { name: "Name", value: "Points to / Target / TXT value" },
    rootName: "@",
    steps: [
      "Sign in to hPanel and open Domains.",
      "Click Manage next to your domain, then DNS / Nameservers in the left menu.",
      "Under Manage DNS records, pick the Type, paste the Name and the Value, then click Add Record.",
      "Repeat for each record in the table.",
    ],
    tips: [
      "Delete the existing A record for “@” and the CNAME for “www” first (they point to Hostinger's parking page).",
    ],
  },
  {
    id: "porkbun",
    name: "Porkbun",
    dnsUrl: () => "https://porkbun.com/account/domainsSpeedy",
    helpUrl: null,
    fields: { name: "Host", value: "Answer" },
    rootName: "blank",
    steps: [
      "Sign in to Porkbun and open Domain Management.",
      "Next to your domain, click DNS.",
      "Pick the Type, type the Name into Host (leave Host empty for “@”), paste the Value into Answer, then click Add.",
      "Repeat for each record in the table.",
    ],
    tips: ["Delete the default ALIAS and CNAME records that point to pixie.porkbun.com."],
  },
  {
    id: "ionos",
    name: "IONOS",
    dnsUrl: () => "https://my.ionos.com/domains",
    helpUrl: null,
    fields: { name: "Host name", value: "Points to / Value" },
    rootName: "@",
    steps: [
      "Sign in to IONOS and open Domains & SSL.",
      "Click the gear (⚙) next to your domain and choose DNS.",
      "Click Add record, pick the Type, paste the Name into Host name and the Value, then click Save.",
      "Repeat for each record in the table.",
    ],
    tips: [
      "If IONOS warns that the new record conflicts with an existing one, choose to replace it. Keep email (MX) records.",
    ],
  },
  {
    id: "wix",
    name: "Wix",
    dnsUrl: () => "https://manage.wix.com/account/domains",
    helpUrl: null,
    fields: { name: "Host name", value: "Value / Points to" },
    rootName: "@",
    steps: [
      "Sign in to Wix and open Domains.",
      "Click the ⋯ next to your domain and choose Manage DNS Records.",
      "Find the section for the record type (A, CNAME or TXT), click Edit or + Add Record, paste the Name and Value, then click Save.",
      "Repeat for each record in the table.",
    ],
    tips: ["Edit the existing A record for your domain instead of adding a second one."],
  },
  {
    id: "other",
    name: "Somewhere else",
    dnsUrl: () => null,
    helpUrl: null,
    fields: { name: "Name / Host", value: "Value / Points to" },
    rootName: "@",
    steps: [
      "Sign in where you bought your domain.",
      "Look for a page called DNS, DNS Records, Zone Editor or Advanced DNS.",
      "Add each record from the table above: pick the Type, paste the Name and the Value, and save.",
    ],
    tips: [
      "“@” means the domain itself. Some companies want you to leave the name empty instead.",
      "If there's already an A record for “@” or a CNAME for “www”, edit it instead of adding another.",
      "Stuck? Email hello@nosweatfd.com with a screenshot and we'll tell you exactly where to click.",
    ],
  },
];

export function guideById(id: DnsGuideId): DnsGuide {
  const guide = DNS_GUIDES.find((g) => g.id === id) ?? DNS_GUIDES.find((g) => g.id === "other");
  if (!guide) throw new Error("Missing DNS guide.");
  return guide;
}
