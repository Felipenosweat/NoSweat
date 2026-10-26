import type { TeamMember } from "@nosweat/schema";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PageHeader, sectionTitle } from "@/components/DashboardUi";
import { EmptyState, GlassCard, cx, focusRing } from "@/components/glass";
import { initialsOf, phoneHref } from "@/lib/clients";
import { getViewer } from "@/server/auth/viewer";
import { listTeam } from "@/server/office/service";
import { OfficeTabs } from "../office/_ui/ui";
import { PersonIcon, TEAM_COLOR_STYLES, nextFreeColor } from "../schedule/ui";
import { AddMemberButton, MemberMenu } from "./TeamControls";
import { GuideHint } from "../GuideHint";

export const metadata: Metadata = { title: "Team", robots: { index: false } };

/** Equipe do dono. `null` = erro ao ler. */
async function loadTeam(ownerId: string): Promise<TeamMember[] | null> {
  try {
    const members = await listTeam(ownerId);
    return [...members].sort((a, b) =>
      a.name.localeCompare(b.name, "en-US", { sensitivity: "base" }),
    );
  } catch (error) {
    console.error("[team] could not list the team", error);
    return null;
  }
}

function MemberRow({ member, readOnly }: { member: TeamMember; readOnly: boolean }) {
  const style = TEAM_COLOR_STYLES[member.color];
  return (
    <li className="flex min-h-16 items-center gap-3 border-t border-(--glass-rim) px-4 py-3 first:border-t-0 sm:px-5">
      <span
        aria-hidden="true"
        className={cx(
          "grid size-11 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-semibold",
          style.block,
          !member.active && "opacity-50",
        )}
      >
        {initialsOf(member.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-5 font-semibold text-ink">{member.name}</p>
        <p className="mt-0.5 truncate text-[13px] leading-5 text-slate-500">
          {member.role || "Team member"}
          <span className="sr-only">, color {style.label}</span>
          {member.phone && (
            <>
              {" · "}
              <a
                href={`tel:${phoneHref(member.phone)}`}
                className={`font-medium text-brand tabular-nums underline-offset-4 hover:underline ${focusRing}`}
              >
                {member.phone}
              </a>
            </>
          )}
        </p>
      </div>
      <MemberMenu member={member} readOnly={readOnly} />
    </li>
  );
}

export default async function TeamPage() {
  // Sempre na hora do request (dados do dono).
  await connection();
  // No modo "ver como" do admin, a equipe da conta vista (só leitura).
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/team");
  const readOnly = viewer.viewingAs !== null;
  const members = await loadTeam(viewer.ownerId);

  const active = members?.filter((m) => m.active) ?? [];
  const inactive = members?.filter((m) => !m.active) ?? [];
  const defaultColor = nextFreeColor(members ?? []);

  return (
    // Mesma largura e abas das outras telas do escritório (Settings, Price book).
    <div className="max-w-3xl">
      <PageHeader
        title="Team"
        description="Team members don’t log in yet. Add them here so you can assign them to jobs and see who’s where on your schedule."
        actions={
          !readOnly && members && members.length > 0 ? (
            <AddMemberButton defaultColor={defaultColor} />
          ) : undefined
        }
      />
      <div className="mt-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <OfficeTabs current="team" />
      </div>

      {members === null ? (
        <p
          role="alert"
          className="glass-edge mt-8 rounded-2xl bg-red-50/90 px-4 py-3 text-[15px] text-red-700"
        >
          We couldn&rsquo;t load your team. Please refresh the page.
        </p>
      ) : members.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<PersonIcon />}
          title="Who works with you?"
          description="Add your technicians, helpers or office staff. Each person gets a color, so you can tell at a glance who’s on which job."
          actions={
            readOnly ? undefined : (
              <AddMemberButton defaultColor={defaultColor} label="Add your first team member" />
            )
          }
          footnote={<GuideHint section="team" />}
        />
      ) : (
        <div className="mt-8 grid gap-8">
          <section aria-labelledby="team-active">
            <h2 id="team-active" className={sectionTitle}>
              Active
              <span className="font-sans font-normal text-slate-500 tabular-nums">
                {" "}
                · {active.length}
              </span>
            </h2>
            {active.length === 0 ? (
              <EmptyState
                framed={false}
                headingLevel={3}
                className="mt-3"
                icon={<PersonIcon />}
                title="No one is active"
                description={
                  readOnly
                    ? "Everyone on this team is inactive."
                    : "Reactivate someone below or add a new person."
                }
              />
            ) : (
              <GlassCard as="div" padding="none" className="mt-3 overflow-hidden">
                <ul>
                  {active.map((member) => (
                    <MemberRow key={member.id} member={member} readOnly={readOnly} />
                  ))}
                </ul>
              </GlassCard>
            )}
          </section>

          {inactive.length > 0 && (
            <section aria-labelledby="team-inactive">
              <h2 id="team-inactive" className={sectionTitle}>
                Inactive
                <span className="font-sans font-normal text-slate-500 tabular-nums">
                  {" "}
                  · {inactive.length}
                </span>
              </h2>
              <p className="mt-1 text-[13px] text-slate-500">
                They keep their name on old jobs but can&rsquo;t be assigned to new ones.
              </p>
              <GlassCard as="div" padding="none" className="mt-3 overflow-hidden">
                <ul>
                  {inactive.map((member) => (
                    <MemberRow key={member.id} member={member} readOnly={readOnly} />
                  ))}
                </ul>
              </GlassCard>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
