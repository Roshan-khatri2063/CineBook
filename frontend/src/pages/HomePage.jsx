import { useEffect } from "react";
import { toast } from "sonner";
import { MdMovie } from "react-icons/md";
import { FiCheckCircle, FiXCircle, FiRefreshCw } from "react-icons/fi";
import useHealthCheck from "../hooks/useHealthCheck.js";

function StatusRow({ label, ok, text }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-stone-600">{label}</span>
      <span
        className={`flex items-center gap-2 font-medium ${
          ok ? "text-emerald-700" : "text-red-700"
        }`}
      >
        {ok ? <FiCheckCircle /> : <FiXCircle />}
        {text}
      </span>
    </div>
  );
}

export default function HomePage() {
  const { data, loading, error, refresh } = useHealthCheck();

  useEffect(() => {
    if (error) toast.error(error, { id: "health-error" });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <div className="flex items-center gap-3">
        <MdMovie className="text-4xl text-red-800" />
        <h1 className="text-3xl font-bold tracking-tight">CineBook Lite</h1>
      </div>
      <p className="mt-2 text-stone-600">
        Project setup is complete. This page checks that the frontend can talk
        to the backend and database.
      </p>

      <section className="mt-8 rounded-lg border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">System status</h2>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Check again
          </button>
        </div>

        <div className="mt-3 divide-y divide-stone-100">
          {loading && <p className="py-3 text-stone-500">Checking…</p>}

          {!loading && error && (
            <>
              <StatusRow label="API" ok={false} text="Unreachable" />
              <p className="py-3 text-sm text-red-700">{error}</p>
            </>
          )}

          {!loading && data && (
            <>
              <StatusRow label="API" ok text="Running" />
              <StatusRow
                label="Database"
                ok={data.database === "connected"}
                text={data.database === "connected" ? "Connected" : "Disconnected"}
              />
              <div className="flex items-center justify-between py-3 text-sm text-stone-500">
                <span>Uptime</span>
                <span>{data.uptimeSeconds}s</span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
