import { ArticleProcessor } from "@/app/components/ArticleProcessor";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-linear-to-b from-slate-100 to-white px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <ArticleProcessor />
    </main>
  );
}
