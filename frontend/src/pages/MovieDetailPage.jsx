import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiClock, FiExternalLink, FiGlobe } from "react-icons/fi";
import PosterImage from "../components/movies/PosterImage.jsx";
import { EmptyState, ErrorState } from "../components/ui/StateViews.jsx";
import useFetch from "../hooks/useFetch.js";
import * as movieService from "../services/movieService.js";
import {
  dayKey,
  formatCurrency,
  formatDayHeading,
  formatDuration,
  formatReleaseDate,
  formatTime,
} from "../utils/format.js";

function ShowtimeButton({ showtime }) {
  const soldOut = showtime.availableSeats === 0;
  const low = !soldOut && showtime.availableSeats <= 10;
  const label = `${formatTime(showtime.startTime)} on ${showtime.screen.name}`;
  const body = (
    <>
      <span className="block text-lg font-bold">
        {formatTime(showtime.startTime)}
      </span>
      <span className="block text-xs text-stone-600">
        {showtime.screen.name}
      </span>
      <span
        className={`mt-1 block text-xs font-medium ${soldOut ? "text-red-700" : low ? "text-amber-700" : "text-emerald-700"}`}
      >
        {soldOut ? "Sold out" : `${showtime.availableSeats} seats left`}
      </span>
      <span className="block text-xs text-stone-500">
        from {formatCurrency(showtime.standardPrice)}
      </span>
    </>
  );

  if (soldOut) {
    return (
      <div
        aria-label={`${label}, sold out`}
        className="min-w-32 cursor-not-allowed rounded-lg border border-stone-200 bg-stone-100 px-4 py-3 opacity-70"
      >
        {body}
      </div>
    );
  }
  return (
    <Link
      to={`/showtimes/${showtime.id}/book`}
      aria-label={`Book ${label}`}
      className="min-w-32 rounded-lg border border-stone-300 bg-white px-4 py-3 transition hover:border-red-800 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-800/40"
    >
      {body}
    </Link>
  );
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const movieQuery = useFetch(() => movieService.getMovie(id), [id]);
  const showsQuery = useFetch(() => movieService.getMovieShowtimes(id), [id]);
  const movie = movieQuery.data;

  const days = useMemo(() => {
    const groups = new Map();
    for (const showtime of showsQuery.data ?? []) {
      const key = dayKey(showtime.startTime);
      if (!groups.has(key))
        groups.set(key, {
          key,
          heading: formatDayHeading(showtime.startTime),
          items: [],
        });
      groups.get(key).items.push(showtime);
    }
    return [...groups.values()];
  }, [showsQuery.data]);

  if (movieQuery.loading && !movie) {
    return (
      <div
        className="mx-auto max-w-5xl animate-pulse px-4 py-10"
        role="status"
        aria-label="Loading movie"
      >
        <div className="h-64 rounded-lg bg-stone-200" />
      </div>
    );
  }
  if (movieQuery.error && !movie) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message={movieQuery.error} onRetry={movieQuery.reload} />
        <p className="text-center">
          <Link to="/" className="text-red-800 underline">
            Back to all movies
          </Link>
        </p>
      </div>
    );
  }

  return (
    <main>
      <section className="bg-stone-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-1 text-sm text-stone-300 hover:text-white"
          >
            <FiArrowLeft /> All movies
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row">
            <PosterImage
              movie={movie}
              className="aspect-[2/3] w-44 shrink-0 self-center rounded-lg shadow-lg sm:self-start"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-red-800 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                  {movie.status === "COMING_SOON"
                    ? "Coming soon"
                    : "Now showing"}
                </span>
                {movie.ageRating && (
                  <span className="rounded border border-stone-500 px-2 py-0.5 text-xs font-semibold">
                    {movie.ageRating}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {movie.title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-300">
                <span>{movie.genre}</span>
                <span className="flex items-center gap-1">
                  <FiClock /> {formatDuration(movie.durationMinutes)}
                </span>
                <span className="flex items-center gap-1">
                  <FiGlobe /> {movie.language}
                </span>
                <span>Released {formatReleaseDate(movie.releaseDate)}</span>
              </p>
              <p className="mt-4 max-w-2xl leading-relaxed text-stone-200">
                {movie.description}
              </p>
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-md border border-stone-500 px-4 py-2 text-sm font-medium hover:bg-stone-800"
                >
                  Watch trailer <FiExternalLink />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6"
        aria-labelledby="showtimes-heading"
      >
        <h2 id="showtimes-heading" className="text-xl font-bold tracking-tight">
          Showtimes
        </h2>

        {showsQuery.loading && !showsQuery.data && (
          <p className="mt-4 text-stone-500" role="status">
            Loading showtimes…
          </p>
        )}
        {showsQuery.error && !showsQuery.data && (
          <ErrorState message={showsQuery.error} onRetry={showsQuery.reload} />
        )}
        {showsQuery.data && days.length === 0 && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-white">
            <EmptyState
              title="No upcoming showtimes"
              hint={
                movie.status === "COMING_SOON"
                  ? "Showtimes will be announced closer to the release."
                  : "Please check back soon."
              }
            />
          </div>
        )}

        <div className="mt-4 space-y-6">
          {days.map((day) => (
            <div key={day.key}>
              <h3 className="mb-2 font-semibold text-stone-700">
                {day.heading}
              </h3>
              <div className="flex flex-wrap gap-3">
                {day.items.map((showtime) => (
                  <ShowtimeButton key={showtime.id} showtime={showtime} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
