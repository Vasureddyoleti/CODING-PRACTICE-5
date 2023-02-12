const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const convertDbObjectToResponseObject = (movie) => {
  return {
    movieId: movie.movie_id,
    directorId: movie.director_id,
    movieName: movie.movie_name,
    leadActor: movie.lead_actor,
  };
};
//GET movies
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `SELECT movie_name FROM movie`;
  const movies = await db.all(getMoviesQuery);
  response.send(movies.map((movie) => convertDbObjectToResponseObject(movie)));
});
//POST movie
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    INSERT INTO movie(director_id,movie_name,lead_actor)
    VALUES(${directorId},'${movieName}','${leadActor}');`;
  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});
//GET movie by ID
app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT * FROM movie 
    WHERE movie_id=${movieId};`;

  const movieArr = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movieArr));
});

//UPADTE movie by ID

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `UPADTE movie
  SET
   director_id=${directorId},
   movie_name='${movieName}',
   lead_actor='${leadActor}'
   WHERE 
   movie_id=${movieId};
  `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//DELETE movie by ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `DELETE FROM movie WHERE movie_id=${movieId};`;
  await db.run(deleteMovie);
  response.send("Movie Removed");
});

const convertDirectorObject = (director) => {
  return {
    directorId: director.director_id,
    directorName: director.director_name,
  };
};

//GET directors
app.get("/directors/", async (request, response) => {
  const getDirectors = `SELECT * FROM director;`;

  const directorsArr = await db.all(getDirectors);
  response.send(
    directorsArr.map((director) => convertDirectorObject(director))
  );
});

//GET movies by directorID
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieName = `SELECT movie_name FROM movie 
    WHERE director_id=${directorId};`;
  const moviesArr = await db.all(getMovieName);
  response.send(
    moviesArr.map((movie) => convertDbObjectToResponseObject(movie))
  );
});

module.exports = app;
