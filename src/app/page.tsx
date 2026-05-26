import { fetchArticleWithMarks } from "@/lib/wikipedia";
import SearchInput from "@/components/SearchInput";
import ArticleView from "@/components/ArticleView";
import Link from "next/link";

async function getArticleData(title: string, step: string, total: string, seed: string) {
  try {
    return await fetchArticleWithMarks(title, parseInt(step), parseInt(total), seed);
  } catch {
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; step?: string; total?: string; seed?: string }>;
}) {
  const params = await searchParams;
  const { title, step, total, seed } = params;

  if (title && step && total && seed) {
    const data = await getArticleData(title, step, total, seed);

    if (!data) {
      return (
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-stone-500 text-lg">Article not found.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-amber-200/60 hover:text-amber-200 transition-colors text-sm"
            >
              Try another topic
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <ArticleView data={data} seed={seed} />
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-20">
      <SearchInput />
    </main>
  );
}
