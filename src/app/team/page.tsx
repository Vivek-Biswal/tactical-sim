import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelCard } from "@/components/ui/PanelCard";

export default function TeamPage() {
  return <AppShell pageTitle="FIELD TEAM" role="team">
    <PageHeader label="TEAM WORKSPACE" title="Stay connected. Report clearly." description="Use separate pages for your map, received reports, and exercise review." />
    <div className="my-6 rounded-xl border border-[#D9D8CE] bg-[#EEF3E8] p-5 text-sm text-[#344438]"><h2 className="font-black">Join your team’s shared exercise</h2><p className="mt-2">Enter the room ID from your instructor and choose Team Alpha, Bravo, or Charlie. Everyone follows the same server clock.</p><Link className="mt-4 inline-block rounded-lg bg-[#556B3F] px-4 py-3 font-bold text-white" href="/training">Join an exercise →</Link></div>
    <h2 className="mb-4 text-sm font-black text-[#344438]">Explore with local practice</h2>
    <div className="grid gap-4 sm:grid-cols-2">{[
      ["setup", "Training setup", "Choose an Indian training area and your force."],
      ["map", "Tactical map", "Explore the 2D grid or real-world 3D terrain."],
      ["situation", "Situation", "See what information is available or uncertain."],
      ["communications", "Communications", "Read and send simulated reports."],
      ["review", "Review & export", "Review the recorded timeline and download it."],
    ].map(([section, title, description]) => <Link key={section} href={`/team/simulation/EX-001/${section}`}><PanelCard><h3 className="font-black text-[#344438]">{title} →</h3><p className="mt-2 text-sm text-[#687066]">{description}</p></PanelCard></Link>)}</div>
  </AppShell>;
}
