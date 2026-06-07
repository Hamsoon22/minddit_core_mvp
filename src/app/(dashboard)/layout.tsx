import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/ui/Sidebar";
import Footer from "@/components/ui/Footer";
import PageTransition from "@/components/ui/PageTransition";
import GlobalToast from "@/components/ui/GlobalToast";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login");

  const requestHeaders = headers();
  const isIframeRequest = requestHeaders.get("sec-fetch-dest") === "iframe";

  if (isIframeRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageTransition>{children}</PageTransition>
        <GlobalToast />
      </div>
    );
  }

  return (
    <>
      <div className="hidden h-screen items-center justify-center bg-gray-50 px-6 text-center max-[1350px]:flex">
        <p className="text-lg font-semibold text-gray-700">PC로 접속해주세요.</p>
      </div>

      <div className="flex h-screen overflow-hidden bg-gray-50 max-[1350px]:hidden">
        <Sidebar user={{ name: "서윤희", organization: "마인딧센터" }} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <Footer />
        <GlobalToast />
      </div>
    </>
  );
}
