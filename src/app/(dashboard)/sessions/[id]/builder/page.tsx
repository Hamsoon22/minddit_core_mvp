import { mockSessions } from "@/lib/mock";
import { notFound } from "next/navigation";
import SessionBuilder from "@/components/session/SessionBuilder";

export default function BuilderPage({ params }: { params: { id: string } }) {
  const session = mockSessions.find(s => s.id === params.id) ?? mockSessions[0];
  if (!session) notFound();
  return <SessionBuilder session={session} />;
}
