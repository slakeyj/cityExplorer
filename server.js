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

function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}

app.get('/location', (request, response) => {
  const query = request.query.data; //seattle
  // console.log('LOCATION QUERY', query);
  client.query(`SELECT * FROM locations WHERE search_query=$1`, [query]).then(sqlResult => {
    if (sqlResult.rowCount > 0) {
      response.send(sqlResult.rows[0]);
    } else {


      const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;

      // superagent.get('url as a string');
      superagent.get(urlToVisit).then(responseFromSuper => {
        // console.log('stuff', responseFromSuper.body);

        // I simply replaced my geodata require, with the data in the body of my superagent response
        const geoData = responseFromSuper.body;

        //THIS IS WHAT WRITES DATA TO SQL DATABASE

        const specificGeoData = geoData.results[0];

        const formatted = specificGeoData.formatted_address;
        const lat = specificGeoData.geometry.location.lat;
        const lng = specificGeoData.geometry.location.lng;

        const newLocation = new Location(query, formatted, lat, lng)

        const sqlQueryInsert = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4);`;
        const sqlValueArr = [newLocation.search_query, newLocation.formatted_query, newLocation.latitude, newLocation.longitude];
        client.query(sqlQueryInsert, sqlValueArr);

        response.send(newLocation);
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })
    }

  })
})


function Day(summary, time) {
  this.forecast = summary;
  this.time = new Date(time * 1000).toDateString();
  this.created_at = Date.now();
}


app.get('/weather', (request, response) => {
  const localData = request.query.data;
  //console.log('LOCAL DATA', localData);

  client.query(`SELECT * FROM weather WHERE search_query=$1`, [localData.search_query]).then(sqlResult => {

    let notTooOld = true;
    if (sqlResult.rowCount > 0) {
      const age = sqlResult.rows[0].created_at;
      // console.log('sql result', sqlResult.rows[0].created_at);
      const ageInSeconds = (Date.now() - age) / 1000;
      if (ageInSeconds > 15) {
        notTooOld = false;
        client.query('DELETE FROM weather WHERE search_query=$1', [localData.search_query]);
      }
      console.log('weather age in seconds', ageInSeconds);
    }
    if (sqlResult.rowCount > 0 && notTooOld) {
      response.send(sqlResult.rows);
    } else {

      const darkSkyUrl = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${localData.latitude},${localData.longitude}`;

      superagent.get(darkSkyUrl).then(responseFromSuper => {
        const weatherBody = responseFromSuper.body;

        const eightDays = weatherBody.daily.data;

        const formattedDays = eightDays.map(day =>
          new Day(day.summary, day.time));

        // console.log('formatted days', formattedDays);
        formattedDays.forEach(day => {
          const sqlQueryInsert = `INSERT INTO weather (search_query, forecast, time, created_at) VALUES ($1,$2,$3,$4);`;
          const sqlValueArr = [localData.search_query, day.forecast, day.time, day.created_at];
          client.query(sqlQueryInsert, sqlValueArr);
        })
        response.send(formattedDays);
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })

    }

  })

})

// constructor function for eventbrite
function Events(link, name, date, summary) {
  this.link = link;
  this.name = name;
  this.event_date = new Date(date).toDateString();
  this.summary = summary;
}
// set up an app.get for /eventbrite
app.get('/events', (request, response) => {
  let eventData = request.query.data;
  //console.log('event data', eventData);
  client.query(`SELECT * FROM events WHERE search_query=$1`, [eventData.search_query]).then(sqlResult => {

    if (sqlResult.rowCount > 0) {
      response.send(sqlResult.rows);
    } else {

      const eventUrlData =
        `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${eventData.latitude}&location.longitude=${eventData.longitude}&token=ZDDD2HU3AK5DLAZ6IYF5`


      superagent.get(eventUrlData).then(responseFromSuper => {
        // console.log('stuff', responseFromSuper.body.events);

        const eventBody = responseFromSuper.body.events;

        const dailyEvents = eventBody.slice(0, 20).map(day => new Events(day.url, day.name.text, day.start.local, day.description.text));

        dailyEvents.forEach(event => {
          const sqlQueryInsert = `INSERT INTO events (search_query, link, name, event_date, summary) VALUES ($1,$2,$3,$4,$5);`;
          const sqlValueArr = [eventData.search_query, event.link, event.name, event.date, event.summary];
          client.query(sqlQueryInsert, sqlValueArr);
        })

        response.send(dailyEvents);
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);

      })

    }
  })
})

// MOVIE DB

function Movie(title, overview, average_votes, image_url, popularity, released_on) {
  this.title = title;
  this.overview = overview;
  this.average_votes = average_votes;
  this.image_url = `https://image.tmdb.org/t/p/w500${image_url}`;
  this.popularity = popularity;
  this.released_on = released_on;
  this.created_at = Date.now();
}
app.get('/movies', getMovies);

function getMovies(request, response) {
  const movieData = request.query.data;

  client.query(`SELECT * FROM movies WHERE search_query=$1`, [movieData.search_query]).then(sqlResult => {

    let notTooOld = true;

    if (sqlResult.rowCount > 0) {
      const age = sqlResult.rows[0].created_at;
      // console.log('sql result', sqlResult.rows[0].created_at);
      const ageInSeconds = (Date.now() - age) / 1000;
      if (ageInSeconds > 2592000) {
        notTooOld = false;
        client.query('DELETE FROM movies WHERE search_query=$1', [movieData.search_query]);
      }
      console.log('movies age in seconds', ageInSeconds);
    }
    if (sqlResult.rowCount > 0 && notTooOld) {
      response.send(sqlResult.rows);

    } else {

      const movieUrlData = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${movieData.search_query}`;


      superagent.get(movieUrlData).then(responseFromSuper => {
        // console.log('stuff', responseFromSuper.body.events);

        const movieBody = responseFromSuper.body.results;
        const allMovies = movieBody.slice(0, 20).map(movie => new Movie(movie.title, movie.overview, movie.vote_average, movie.poster_path, movie.popularity, movie.release_date));

        allMovies.forEach(movie => {
          const sqlQueryInsert = `INSERT INTO movies (search_query, title, overview, average_votes, image_url, popularity, released_on, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`;
          const sqlValueArr = [movieData.search_query, movie.title, movie.overview, movie.average_votes, movie.image_url, movie.popularity, movie.released_on, movie.created_at];
          client.query(sqlQueryInsert, sqlValueArr);
        })

        response.send(allMovies);
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })
    }
  })
}

// YELP
function Getyelp(name, image_url, price, rating, url) {
  this.name = name;
  this.image_url = image_url;
  this.price = price;
  this.rating = rating;
  this.url = url;
  this.created_at = Date.now();
}

app.get('/yelp', getReviews);

function getReviews(request, response) {
  const reviewData = request.query.data;

  client.query(`SELECT * FROM reviews WHERE search_query=$1`, [reviewData.search_query]).then(sqlResult => {
    // console.log('sql result', sqlResult);
    // console.log(reviewData)

    let notTooOld = true;

    if (sqlResult.rowCount > 0) {
      console.log('in thing')
      const age = sqlResult.rows[0].created_at;
      //console.log('sql result', sqlResult.rows[0].created_at);
      const ageInSeconds = (Date.now() - age) / 1000;
      if (ageInSeconds > 10) {
        notTooOld = false;
        client.query('DELETE FROM reviews WHERE search_query=$1', [reviewData.search_query]);
      }
      console.log('reviews age in seconds', ageInSeconds);
    }
    if (sqlResult.rowCount > 0 && notTooOld) {
      response.send(sqlResult.rows);

    } else {


      const api_url = `https://api.yelp.com/v3/businesses/search?latitude=${reviewData.latitude}&longitude=${reviewData.longitude}`;

      superagent.get(api_url).set('Authorization', `Bearer ${process.env.YELP_API_KEY}`).then(responseFromSuper => {
        const yelpData = responseFromSuper.body;
        //console.log(yelpData)
        const specificYelpData = yelpData.businesses;


        const allReviews = specificYelpData.slice(0, 20).map(review => new Getyelp(review.name, review.image_url, review.price, review.rating, review.url, review.created_at));


        allReviews.forEach(review => {
          const sqlQueryInsert = `INSERT INTO reviews (search_query, name, image_url, price, rating, url, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7);`;

          const sqlValueArr = [reviewData.search_query, review.name, review.image_url, review.price, review.rating, review.url, review.created_at];
          client.query(sqlQueryInsert, sqlValueArr);
        })

        response.send(allReviews);
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })
    }
  })

}


app.listen(PORT, () => { console.log(`app is up on PORT ${PORT}`) });
