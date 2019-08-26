'use strict';

const express = require('express');
const cors = require('cors');
//superagent talks to the internet over http
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config()

const app = express();
app.use(cors());

//postgres client
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
// setup error logging
client.on('error', (error) => console.error(error));

const PORT = process.env.PORT;


// CONSTRUCTORS
function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}

function Weather(summary, time) {
  this.forecast = summary;
  this.time = new Date(time * 1000).toDateString();
  this.created_at = Date.now();
}

function Events(link, name, date, summary) {
  this.link = link;
  this.name = name;
  this.event_date = new Date(date).toDateString();
  this.summary = summary;
  this.created_at = Date.now();
}

function Movie(title, overview, average_votes, image_url, popularity, released_on) {
  this.title = title;
  this.overview = overview;
  this.average_votes = average_votes;
  this.image_url = `https://image.tmdb.org/t/p/w500${image_url}`;
  this.popularity = popularity;
  this.released_on = released_on;
  this.created_at = Date.now();
}

function YelpReview(name, image_url, price, rating, url) {
  this.name = name;
  this.image_url = image_url;
  this.price = price;
  this.rating = rating;
  this.url = url;
  this.created_at = Date.now();
}

// ROUTES
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/events', getEvents);
app.get('/movies', getMovies);
app.get('/yelp', getReviews);

// INSERT VALUES
function insertEventValuesIntoTable(response, data, dailyEvents) {
  dailyEvents.forEach(event => {
    const sqlQueryInsert = `INSERT INTO events (search_query, link, name, event_date, summary, created_at) VALUES ($1,$2,$3,$4,$5,$6);`;
    const sqlValueArr = [data.search_query, event.link, event.name, event.date, event.summary, event.created_at];
    client.query(sqlQueryInsert, sqlValueArr);
  })
  response.send(dailyEvents);
}

function insertLocationValuesIntoTable(response, newLocation) {
  const sqlQueryInsert = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4);`;
  const sqlValueArr = [newLocation.search_query, newLocation.formatted_query, newLocation.latitude, newLocation.longitude];
  client.query(sqlQueryInsert, sqlValueArr);

  response.send(newLocation);
}

function insertWeatherValuesIntoTable(response, formattedDays, data) {
  formattedDays.forEach(day => {
    const sqlQueryInsert = `INSERT INTO weather (search_query, forecast, time, created_at) VALUES ($1,$2,$3,$4);`;
    const sqlValueArr = [data.search_query, day.forecast, day.time, day.created_at];
    client.query(sqlQueryInsert, sqlValueArr);
  })
  response.send(formattedDays);
}

function insertMovieValuesIntoTable(response, allMovies, data) {
  allMovies.forEach(movie => {
    const sqlQueryInsert = `INSERT INTO movies (search_query, title, overview, average_votes, image_url, popularity, released_on, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`;
    const sqlValueArr = [data.search_query, movie.title, movie.overview, movie.average_votes, movie.image_url, movie.popularity, movie.released_on, movie.created_at];
    client.query(sqlQueryInsert, sqlValueArr);
  })
  response.send(allMovies);
}

function insertReviewValuesIntoTable(response, allReviews, data) {
  allReviews.forEach(review => {
    const sqlQueryInsert = `INSERT INTO reviews (search_query, name, image_url, price, rating, url, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7);`;
    const sqlValueArr = [data.search_query, review.name, review.image_url, review.price, review.rating, review.url, review.created_at];
    client.query(sqlQueryInsert, sqlValueArr);
  })
  response.send(allReviews);
}

function returnError(error, response) {
  response.status(500).send(error.message);
  console.error(error);
}

let notTooOld = true;
function checkSearchAge(sqlResult, data) {
  if (sqlResult.rowCount > 0) {
    const age = sqlResult.rows[0].created_at;
    const ageInSeconds = (Date.now() - age) / 1000;
    if (ageInSeconds > 10) {
      notTooOld = false;
      client.query('DELETE FROM events WHERE search_query=$1', [data.search_query]);
    }
    console.log('age in seconds', ageInSeconds);
  }
}


// SEND DATA
function sendGeoData(sqlResult, query, response, urlToVisit) {
  if (sqlResult.rowCount > 0) {
    response.send(sqlResult.rows[0]);
  } else {
    superagent.get(urlToVisit).then(responseFromSuper => {
      const geoData = responseFromSuper.body;
      const specificGeoData = geoData.results[0];
      const formatted = specificGeoData.formatted_address;
      const lat = specificGeoData.geometry.location.lat;
      const lng = specificGeoData.geometry.location.lng;
      const newLocation = new Location(query, formatted, lat, lng)
      insertLocationValuesIntoTable(response, newLocation);

    }).catch(error => {
      returnError(error, response);
    })
  }
}

function sendWeatherData(sqlResult, response, data, darkSkyUrl) {
  if (sqlResult.rowCount > 0 && notTooOld) {
    response.send(sqlResult.rows);
  } else {
    superagent.get(darkSkyUrl).then(responseFromSuper => {
      const weatherBody = responseFromSuper.body;
      const eightDays = weatherBody.daily.data;
      const formattedDays = eightDays.map(day =>
        new Weather(day.summary, day.time));
      insertWeatherValuesIntoTable(response, formattedDays, data);

    }).catch(error => {
      returnError(error, response);
    })
  }
}


function sendEventData(sqlResult, response, data, eventUrlData) {
  if (sqlResult.rowCount > 0 && notTooOld) {
    response.send(sqlResult.rows);
  } else {
    superagent.get(eventUrlData).then(responseFromSuper => {
      // console.log('stuff', responseFromSuper.body.events);
      const eventBody = responseFromSuper.body.events;
      const dailyEvents = eventBody.slice(0, 20).map(day => new Events(day.url, day.name.text, day.start.local, day.description.text));

      insertEventValuesIntoTable(response, data, dailyEvents);
    }).catch(error => {
      returnError(error, response);
    })
  }
}

function sendMovieData(sqlResult, response, data, movieUrlData) {
  if (sqlResult.rowCount > 0 && notTooOld) {
    response.send(sqlResult.rows);
  } else {
    superagent.get(movieUrlData).then(responseFromSuper => {
      const movieBody = responseFromSuper.body.results;
      const allMovies = movieBody.slice(0, 20).map(movie => new Movie(movie.title, movie.overview, movie.vote_average, movie.poster_path, movie.popularity, movie.release_date));
      insertMovieValuesIntoTable(response, allMovies, data)

    }).catch(error => {
      returnError(error, response);
    })
  }
}

function sendReviewData(sqlResult, response, data, api_url) {
  if (sqlResult.rowCount > 0 && notTooOld) {
    response.send(sqlResult.rows);
  } else {
    superagent.get(api_url).set('Authorization', `Bearer ${process.env.YELP_API_KEY}`).then(responseFromSuper => {
      const yelpData = responseFromSuper.body;
      const specificYelpData = yelpData.businesses;
      const allReviews = specificYelpData.slice(0, 20).map(review => new YelpReview(review.name, review.image_url, review.price, review.rating, review.url, review.created_at));
      insertReviewValuesIntoTable(response, allReviews, data);
    }).catch(error => {
      returnError(error, response);
    })
  }
}


function getLocation(request, response) {
  const query = request.query.data; //seattle
  const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  client.query(`SELECT * FROM locations WHERE search_query=$1`, [query]).then(sqlResult => {
    sendGeoData(sqlResult, query, response, urlToVisit)
  })
}

function getWeather(request, response) {
  const data = request.query.data;
  const darkSkyUrl = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${data.latitude},${data.longitude}`;
  client.query(`SELECT * FROM weather WHERE search_query=$1`, [data.search_query]).then(sqlResult => {
    checkSearchAge(sqlResult, data);
    sendWeatherData(sqlResult, response, data, darkSkyUrl);
  })
}

// constructor function for eventbrite

function getEvents(request, response) {
  let data = request.query.data;
  const eventUrlData =
    `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${data.latitude}&location.longitude=${data.longitude}&token=${process.env.EVENTBRITE}`
  client.query(`SELECT * FROM events WHERE search_query=$1`, [data.search_query]).then(sqlResult => {
    checkSearchAge(sqlResult, data, notTooOld);
    sendEventData(sqlResult, response, data, eventUrlData);
  })
}

// MOVIE DB
function getMovies(request, response) {
  const data = request.query.data;
  const movieUrlData = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${data.search_query}`;
  client.query(`SELECT * FROM movies WHERE search_query=$1`, [data.search_query]).then(sqlResult => {
    checkSearchAge(sqlResult, data);
    sendMovieData(sqlResult, response, data, movieUrlData);
  })
}

// YELP
function getReviews(request, response) {
  const data = request.query.data;
  const api_url = `https://api.yelp.com/v3/businesses/search?latitude=${data.latitude}&longitude=${data.longitude}`;
  client.query(`SELECT * FROM reviews WHERE search_query=$1`, [data.search_query]).then(sqlResult => {
    checkSearchAge(sqlResult, data);
    sendReviewData(sqlResult, response, data, api_url);
  })
}

app.listen(PORT, () => { console.log(`app is up on PORT ${PORT}`) });
