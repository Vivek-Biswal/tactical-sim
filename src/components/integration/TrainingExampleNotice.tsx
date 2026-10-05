import Link from "next/link";

export function TrainingExampleNotice() {
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D8C7A5] bg-[#F7F5EE] p-4 text-xs text-[#344438]">
    <div><p className="font-black">Interface example · sample data and local actions</p><p className="mt-1 text-[#687066]">Use a shared exercise for the live server timeline, team messages, instructor controls and recorded review.</p></div>
    <Link className="rounded-lg bg-[#556B3F] px-4 py-2.5 font-black text-white hover:bg-[#344438]" href="/training">Create or join a live exercise →</Link>
  </div>;
}
