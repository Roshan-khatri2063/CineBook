import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2 text-stone-600">Your account does not have permission to view this page.</p>
      <Link to="/" className="mt-4 inline-block text-red-800 underline">
        Go to the home page
      </Link>
    </main>
  );
}
