import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-stone-600">The page you opened does not exist.</p>
      <Link to="/" className="mt-4 text-red-800 underline">
        Go to the home page
      </Link>
    </main>
  );
}
