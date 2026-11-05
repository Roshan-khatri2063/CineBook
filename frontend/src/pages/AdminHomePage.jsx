import useAuth from "../hooks/useAuth.js";

// Placeholder that proves the admin-only route works.
// The real dashboard is built in a later module.
export default function AdminHomePage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Admin area</h1>
      <p className="mt-2 text-stone-600">
        Signed in as {user.name} ({user.role}). The admin dashboard will be
        built in a later module.
      </p>
    </main>
  );
}
