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
      <div className="hidden border-b border-gray-200 bg-gray-50 px-6 py-3 text-center text-sm font-semibold text-gray-700 max-[1350px]:block">
        PC에서 보는 것이 가장 좋습니다.
      </div>

      <div className="flex h-screen overflow-hidden bg-gray-50">
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
