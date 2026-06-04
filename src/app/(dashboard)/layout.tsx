import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/ui/Sidebar";
import Footer from "@/components/ui/Footer";
import PageTransition from "@/components/ui/PageTransition";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login");

  return (
    <>
      <div className="hidden h-screen items-center justify-center bg-gray-50 px-6 text-center max-[1350px]:flex">
        <p className="text-lg font-semibold text-gray-700">PC로 접속해주세요.</p>
      </div>

      <div className="flex h-screen overflow-hidden bg-gray-50 max-[1350px]:hidden">
        <Sidebar user={{ name: "데모 전문가", email: "demo@mindflow.kr" }} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
