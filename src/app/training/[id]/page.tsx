import { SharedExercise } from "@/components/integration/SharedExercise";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ role?: string }> }) {
  const { id } = await params;
  const { role } = await searchParams;
  return <SharedExercise key={id} id={id} initialRole={role} />;
}
