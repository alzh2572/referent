import { ArticleProcessor } from "@/app/components/ArticleProcessor";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-100 to-white px-4 py-10 sm:px-6 lg:px-8">
      <ArticleProcessor />
    </main>
  );
}
