DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7)
);
-- CREATE TABLE locations (
--     id SERIAL PRIMARY KEY,
--     search_query VARCHAR(255),
--     formatted_query VARCHAR(255),
--     latitude NUMERIC(10,7),
--     longitude NUMERIC(10,7)
-- );

-- CREATE TABLE locations (
--     id SERIAL PRIMARY KEY,
--     search_query VARCHAR(255),
--     formatted_query VARCHAR(255),
--     latitude NUMERIC(10,7),
--     longitude NUMERIC(10,7)
-- );

-- CREATE TABLE locations (
--     id SERIAL PRIMARY KEY,
--     search_query VARCHAR(255),
--     formatted_query VARCHAR(255),
--     latitude NUMERIC(10,7),
--     longitude NUMERIC(10,7)
-- );

-- to test that things work

-- INSERT INTO locations 
-- (search_query, formatted_query, latitude, longitude)
-- VALUES
-- ('las vegas', 'LAS VEGASSSSS', 33.333333, 122.2222222)

