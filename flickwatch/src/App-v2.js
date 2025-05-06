import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = '24f165a4'

export default function App() {
  const [query, setQuery] = useState('')
  const [watched, setWatched] = useState([]);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  // const [selectedId, setSelectedId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const controller = new AbortController()

  // Understanding Effects

  // useEffect(function () {
  //   console.log('A');
  // }, [])

  // useEffect(function () {
  //   console.log('B');
  // })

  // console.log('C');

  // useEffect(function () {
  //   console.log('D');
  // }, [query])

  useEffect(function () {

    async function fetchMovies() {

      try {
        setIsLoading(true)
        setError("")
        const res = await fetch(`http://www.omdbapi.com/?i=tt3896198&apikey=${KEY}&s=${query}`,
          { signal: controller.signal }
        );

        if (!res.ok)
          throw new Error("Something went wrong")

        const data = await res.json()
        // console.log(data);

        if (data.Response !== "True") {
          // throw new Error(data.Error)
          setError(data.Error)
        } else {
          setMovies(data.Search)
          setError("")
          // console.log(data.Search);
        }
      }
      catch (err) {
        if (err.name !== 'AbortError') {
          console.log(err.message);
          setError(err.message)
        }
      }
      finally {
        setIsLoading(false)
      }
    }

    if (query.length < 3) {
      setMovies([])
      setError('')
      return
    }

    handleCloseMovie()
    fetchMovies()

    return function () {
      controller.abort()
    }
  }, [query])


  function handleSelect(currId) {
    setSelectedId(selectedId => selectedId === currId ? null : currId)
  }

  function handleCloseMovie() {
    setSelectedId(null)
  }

  function handleAddWatched(watchedMovie) {

    setWatched(watched => [...watched, watchedMovie])
    handleCloseMovie()
  }


  return (
    <>
      <NavBar >
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>

        {/* -- Passing Elements as children (Alternative to Props) */}
        <Box>
          {/* {isLoading ? <Loader /> : <MovieList movies={movies} />} */}
          {isLoading && <Loader />}
          {error && <ErrorMessage message={error} />}
          {!isLoading && !error && <MovieList movies={movies} handleSelect={handleSelect} />}
        </Box>
        <Box>
          {
            selectedId ?
              <MovieDetails selectedId={selectedId} onCloseMovie={handleCloseMovie} setIsLoading={setIsLoading}
                onAddWatched={handleAddWatched}
                watched={watched}
              />
              :
              <>
                <WatchedSummary watched={watched} />
                <WatchedMoviesList watched={watched} setWatched={setWatched} />
              </>
          }
        </Box>
        {/* -- Passing Elements as Props (Alternative to children) */}

        {/* <Box element={<MovieList movies={movies} />} />
        <Box element={
          <>
            <WatchedSummary watched={watched} />
            <WatchedMoviesList watched={watched} />
          </>
        } /> */}
      </Main>
    </>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [userRating, setUserRating] = useState('')

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId)

  const watchedUserRating = watched.find(movie => movie.imdbID === selectedId)?.userRating


  const { Title: title, Year: year, Poster: poster, Runtime: runtime, imdbRating, Plot: plot, Released: released, Actors: actors, Director: director, Genre: genre } = movie;


  function handleAddWatched() {
    const watchedMovie = {
      imdbID: selectedId,
      poster,
      title,
      imdbRating: imdbRating,
      runtime: Number(runtime.split(' ').at(0)),
      userRating
    }
    onAddWatched(watchedMovie)
  }

  useEffect(function () {
    async function getMovieDetails() {
      try {
        setIsLoading(true)
        const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`)
        const data = await res.json()
        setMovie(data)
      } catch (err) {
        console.error('error fetching details: ', err);
      } finally {
        setIsLoading(false)
      }
    }
    getMovieDetails()
  }
    , [selectedId])

  useEffect(
    function () {
      document.title = `Movie | ${title}`

      return function () {
        document.title = "FlickWatch"
      }
    }, [title])


  useEffect(
    function () {

      function callback(e) {
        if (e.code === "Escape") {
          onCloseMovie()
        }
      }

      document.addEventListener("keydown", callback)

      return function () {
        document.removeEventListener("keydown", callback)
      }

    }
    , [onCloseMovie])

  return (


    <div className="details">
      {isLoading ?
        <Loader />
        :
        <>
          <header>

            <button className="btn-back" onClick={onCloseMovie}>
              x
            </button>
            <img src={poster} alt={`Poster of ${title}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>{released} &bull; {runtime}</p>
              <p>{genre}</p>
              <p><span>⭐</span>{imdbRating} IMDb Rating</p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ?
                <>

                  < StarRating maxRating={10} size={24} onSetRating={setUserRating} />

                  {userRating > 0 && (
                    <button className="btn-add" onClick={() => handleAddWatched(movie)}>+ to watched list</button>)
                  }
                </>
                :
                <p>You rated this movie with {watchedUserRating} <span>⭐</span></p>
              }
            </div>
            <p><em>{plot}</em></p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      }
    </div>
  )
}


function Loader() {
  return (
    <p className="loader">Loading...</p>
  )
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⚠️</span>{message}
    </p>
  )
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      {children}
    </nav>
  )
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>FlickWatch</h1>
    </div>)
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
      {/* Found <strong>X</strong> results */}
    </p>
  )
}

function Search({ query, setQuery }) {

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  )
}

function Main({ children }) {

  return (
    <main className="main">
      {children}
    </main>
  )
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "-" : "+"}
      </button>
      {isOpen && children}
    </div>
  )
}

function MovieList({ movies, handleSelect }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} handleSelect={handleSelect} key={movie.imdbID} />
      ))}
    </ul>
  )
}

function Movie({ movie, handleSelect }) {
  // console.log("movie, ", movie);
  return (
    <li onClick={() => handleSelect(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  )
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating)).toFixed(1);
  const avgUserRating = average(watched.map((movie) => movie.userRating)).toFixed(1);
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  )
}

function WatchedMoviesList({ watched, setWatched }) {
  function handleMovieRemove(id) {
    setWatched(watched => watched.filter(movie => movie.imdbID !== id))
  }
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} onMovieRemove={handleMovieRemove} key={movie.imdbID} />
      ))}
    </ul>
  )
}

function WatchedMovie({ movie, onMovieRemove }) {
  return (
    <li >
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button className="btn-delete" onClick={() => onMovieRemove(movie.imdbID)}>x</button>
      </div>
    </li>
  )
}