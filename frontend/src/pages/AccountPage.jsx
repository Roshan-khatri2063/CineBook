import useAuth from "../hooks/useAuth.js";

export default function AccountPage() {
  const { user } = useAuth();

  const rows = [
    ["Name", user.name],
    ["Email", user.email],
    ["Phone", user.phone || "Not provided"],
    ["Role", user.role],
    ["Member since", new Date(user.createdAt).toLocaleDateString()],
  ];

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">My account</h1>
      <dl className="mt-6 divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white px-5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-3">
            <dt className="text-stone-600">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
