import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import MovieCard from "../components/movies/MovieCard.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { EmptyState, ErrorState } from "../components/ui/StateViews.jsx";
import useDebounce from "../hooks/useDebounce.js";
import useFetch from "../hooks/useFetch.js";
import * as movieService from "../services/movieService.js";

const PAGE_SIZE = 12;

function CardSkeletons() {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      role="status"
      aria-label="Loading movies"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-stone-200 bg-white"
        >
          <div className="aspect-[2/3] bg-stone-200" />
          <div className="space-y-2 p-3">
            <div className="h-4 rounded bg-stone-200" />
            <div className="h-3 w-2/3 rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Home page: browse, search and filter movies. The filters live in the URL
// (?tab=soon&genre=Drama&q=neon&page=2), so the Back button and shared links work.
export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "soon" ? "soon" : "now";
  const genre = params.get("genre") ?? "";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [search, setSearch] = useState(q);
  const debouncedSearch = useDebounce(search);

  const update = useCallback(
    (changes, { keepPage = false } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          if (!keepPage) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Put the (debounced) search text into the URL.
  useEffect(() => {
    if (debouncedSearch.trim() !== q) update({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const genres = useFetch(movieService.listGenres, []);
  const { data, loading, error, reload } = useFetch(
    () =>
      movieService.listMovies({
        status: tab === "soon" ? "COMING_SOON" : "NOW_SHOWING",
        q: q || undefined,
        genre: genre || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    [tab, q, genre, page],
  );
  const movies = data?.items ?? [];
  const filtered = Boolean(q || genre);

  const clearFilters = () => {
    setSearch("");
    update({ q: "", genre: "" });
  };

  return (
    <>
      <section className="bg-stone-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What are you watching tonight?
          </h1>
          <p className="mt-2 text-stone-300">
            Pick a movie, choose your seats and book in minutes.
          </p>
          <div className="relative mt-6 max-w-xl">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              aria-label="Search movies"
              placeholder="Search movies by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-700 bg-white py-3 pl-11 pr-4 text-stone-900 outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Movie status"
            className="inline-flex rounded-lg bg-stone-200 p-1"
          >
            {[
              ["now", "Now showing"],
              ["soon", "Coming soon"],
            ].map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => update({ tab: value === "now" ? "" : "soon" })}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === value ? "bg-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by genre"
          >
            <button
              aria-pressed={!genre}
              onClick={() => update({ genre: "" })}
              className={`rounded-full border px-3 py-1 text-sm transition ${!genre ? "border-red-800 bg-red-800 text-white" : "border-stone-300 bg-white hover:bg-stone-100"}`}
            >
              All genres
            </button>
            {(genres.data ?? []).map((name) => (
              <button
                key={name}
                aria-pressed={genre === name}
                onClick={() => update({ genre: genre === name ? "" : name })}
                className={`rounded-full border px-3 py-1 text-sm transition ${genre === name ? "border-red-800 bg-red-800 text-white" : "border-stone-300 bg-white hover:bg-stone-100"}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading && !data && <CardSkeletons />}
          {error && !data && <ErrorState message={error} onRetry={reload} />}
          {error && data && (
            <div
              role="alert"
              className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-800"
            >
              {error}{" "}
              <button className="underline" onClick={reload}>
                Retry
              </button>
            </div>
          )}

          {data && movies.length === 0 && (
            <EmptyState
              title={
                filtered
                  ? "No movies match your search"
                  : tab === "soon"
                    ? "No upcoming releases yet"
                    : "No movies showing right now"
              }
              hint={
                filtered
                  ? "Try a different title or genre."
                  : "Please check back soon."
              }
              action={
                filtered && (
                  <button
                    onClick={clearFilters}
                    className="text-red-800 underline"
                  >
                    Clear search and filters
                  </button>
                )
              }
            />
          )}

          {movies.length > 0 && (
            <div
              className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${loading ? "opacity-60" : ""}`}
            >
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}

          {data && movies.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white">
              <Pagination
                pagination={data.pagination}
                onPageChange={(p) =>
                  update({ page: p > 1 ? p : "" }, { keepPage: true })
                }
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
