import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-stone-600">The page you opened does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-red-800 underline">
        Go to the home page
      </Link>
    </main>
  );
}
