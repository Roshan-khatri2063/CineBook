import { useState } from "react";
import { FiFilm } from "react-icons/fi";

// Shows the poster, or a neat placeholder when there is none or it fails to load.
// The placeholder has no text: the movie title is always printed next to the poster.
export default function PosterImage({ movie, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (movie.posterUrl && !failed) {
    return (
      <img
        src={movie.posterUrl}
        alt={`${movie.title} poster`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${movie.title} poster placeholder`}
      className={`flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900 text-stone-400 ${className}`}
    >
      <FiFilm className="text-4xl" />
    </div>
  );
}
