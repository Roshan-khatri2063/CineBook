import { Link } from "react-router-dom";
import PosterImage from "./PosterImage.jsx";
import { formatDuration, formatReleaseDate } from "../../utils/format.js";

export default function MovieCard({ movie }) {
  const comingSoon = movie.status === "COMING_SOON";

  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[2/3] bg-stone-200">
        <PosterImage movie={movie} className="h-full w-full" />
        {movie.ageRating && (
          <span className="absolute right-2 top-2 rounded bg-stone-900/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {movie.ageRating}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-semibold leading-snug group-hover:text-red-800">
          {movie.title}
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          {movie.genre} · {movie.language}
        </p>
        <p className="text-xs text-stone-500">
          {formatDuration(movie.durationMinutes)}
        </p>
        <p
          className={`mt-auto pt-2 text-xs font-medium ${comingSoon || movie.upcomingShowtimes === 0 ? "text-stone-500" : "text-emerald-700"}`}
        >
          {comingSoon
            ? `Releases ${formatReleaseDate(movie.releaseDate)}`
            : movie.upcomingShowtimes > 0
              ? `${movie.upcomingShowtimes} upcoming show${movie.upcomingShowtimes === 1 ? "" : "s"}`
              : "No upcoming shows"}
        </p>
      </div>
    </Link>
  );
}
