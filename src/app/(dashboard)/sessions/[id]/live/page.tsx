import { mockSessions } from "@/lib/mock";
import { notFound } from "next/navigation";
import LiveController from "@/components/session/LiveController";

export default function LivePage({ params }: { params: { id: string } }) {
  const session = mockSessions.find(s => s.id === params.id) ?? mockSessions[0];
  if (!session) notFound();
  return <LiveController session={session} />;
}
