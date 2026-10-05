import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!["map", "setup", "controls", "situation", "communications", "decisions", "review"].includes(section)) notFound();
  return null;
}
