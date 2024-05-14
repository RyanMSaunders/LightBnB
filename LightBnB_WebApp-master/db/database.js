
const { Pool } = require("pg");

const pool = new Pool({
  user: "development",
  password: "development",
  host: "localhost",
  database: "lightbnb",
});

/// Users

  // Get a single user from database, given their email

const getUserWithEmail = (email) => {
  return pool
    .query('SELECT id, name, email, password FROM users WHERE email = $1', [email])
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};


  // Get a single user from database, given their id

const getUserWithId = (id) => {
  return pool
    .query('SELECT id, name, email, password FROM users WHERE id = $1', [id])
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};


  // Add new user to database

const addUser = (user) => {
  const name = user.name;
  const email = user.email;
  const password = user.password;
  
  return pool
    .query('INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, password])
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};


/// Reservations

  // Get all reservations for a single user

const getAllReservations = (guest_id, limit = 10) => {
  return pool
    .query(
    `
    SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
    `, [guest_id, limit])

    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};



/// Properties

  // Get all properties

const getAllProperties = function(options, limit = 10) {
  
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

    // If user adds city to query add WHERE/AND clause
  if (options.city) {
    queryParams.push(`%${options.city}%`);

    if (queryParams.length === 1) {
      queryString +=  `WHERE city LIKE $${queryParams.length} `;
    } else {
      queryString +=  `AND city LIKE $${queryParams.length} `;
    }
  }

    // If user adds owner_id to query, add WHERE/AND clause
 if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    
    if (queryParams.length === 1) {
      queryString +=  `WHERE owner_id LIKE $${queryParams.length} `;
    } else {
      queryString +=  `AND owner_id LIKE $${queryParams.length} `;
    }

  }
  
    // When user inputs  minimum_price_per_night and a maximum_price_per_night, 
    // returning properties within that price range using WHERE/AND clause.
 if (options.minimum_price_per_night && options.maximum_price_per_night) {
    
    const minInputInCents = Number(options.minimum_price_per_night * 100);
    const maxInputInCents = Number(options.maximum_price_per_night * 100);

    queryParams.push(`${minInputInCents}`);
    queryParams.push(`${maxInputInCents}`);

    if (queryParams.length === 1) {
      queryString +=  `WHERE cost_per_night < $${queryParams.length} `;
    } else {
      queryString +=  `AND cost_per_night < $${queryParams.length} `;
    }

    if (queryParams.length - 1 === 1) {
      queryString +=  `WHERE cost_per_night > $${queryParams.length - 1} `;
    } else {
      queryString +=  `AND cost_per_night > $${queryParams.length - 1} `;
    }
  }

    // Add GROUP BY to query string
  queryString += `
  GROUP BY properties.id`;

    // If user adds minimum_rating to query, add HAVING clause

 if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));

    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

    // Add ORDER BY and LIMIT to query string 
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  
  return pool.query(queryString, queryParams).then((res) => res.rows);
};



  //  Add a property to the database

const addProperty = (property) => {
  const  owner_id = property.owner_id;
  const  title = property.title;
  const  description = property.description;
  const  thumbnail_photo_url = property.thumbnail_photo_url;
  const  cover_photo_url = property.cover_photo_url;
  const  cost_per_night = property.cost_per_night;
  const  street = property.street;
  const  city = property.city;
  const  province = property.province;
  const  post_code = property.post_code;
  const  country = property.country;
  const  parking_spaces = property.parking_spaces;
  const  number_of_bathrooms = property.number_of_bathrooms;
  const  number_of_bedrooms = property.number_of_bedrooms;

  let queryString = `INSERT INTO properties(owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
  RETURNING *`;
  
  let queryParams = [owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms];
  return pool.query(queryString, queryParams)
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};


module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
