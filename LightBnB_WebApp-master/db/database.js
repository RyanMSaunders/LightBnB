const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

const pool = new Pool({
  user: "development",
  password: "development",
  host: "localhost",
  database: "lightbnb",
});

// Connection Test
// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})


/// Users

// /**
//  * Get a single user from the database given their email.
//  * @param {String} email The email of the user.
//  * @return {Promise<{}>} A promise to the user.
//  */
// const getUserWithEmail = function (email) {
//   let resolvedUser = null;
//   for (const userId in users) {
//     const user = users[userId];
//     if (user && user.email.toLowerCase() === email.toLowerCase()) {
//       resolvedUser = user;
//     }
//   }
//   return Promise.resolve(resolvedUser);
// };

const getUserWithEmail = (email) => {
  return pool
    .query('SELECT id, name, email, password FROM users WHERE email = $1', [email])
    .then((result) => {
      // console.log(result.rows[0]);
      // return result.rows;
      if (result.rows.length > 0) {
        console.log(result.rows[0]);
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};


// /**
//  * Get a single user from the database given their id.
//  * @param {string} id The id of the user.
//  * @return {Promise<{}>} A promise to the user.
//  */
// const getUserWithId = function (id) {
//   return Promise.resolve(users[id]);
// };

const getUserWithId = (id) => {
  return pool
    .query('SELECT id, name, email, password FROM users WHERE id = $1', [id])
    .then((result) => {
      // console.log(result.rows[0]);
      // return result.rows;
      if (result.rows.length > 0) {
        console.log(result.rows[0]);
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};


// /**
//  * Add a new user to the database.
//  * @param {{name: string, password: string, email: string}} user
//  * @return {Promise<{}>} A promise to the user.
//  */
// const addUser = function (user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// };

const addUser = (user) => {
  const name = user.name;
  const email = user.email;
  const password = user.password;
  
    return pool
      .query('INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, password])
      .then((result) => {
        if (result.rows.length > 0) {
          console.log(result.rows[0]);
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

// /**
//  * Get all reservations for a single user.
//  * @param {string} guest_id The id of the user.
//  * @return {Promise<[{}]>} A promise to the reservations.
//  */
// const getAllReservations = function (guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// };

const getAllReservations = (guest_id, limit = 10) => {
  return pool
    .query(
    `
    SELECT reservations.*, properties.*
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
    `, [guest_id, limit])

    .then((result) => {
      // console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};



/// Properties

// /**
//  * Get all properties.
//  * @param {{}} options An object containing query options.
//  * @param {*} limit The number of results to return.
//  * @return {Promise<[{}]>}  A promise to the properties.
//  */
// const getAllProperties = function (options, limit = 10) {
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// };

// should limit be = 10?
// const getAllProperties = (options, limit = 10) => {
//   return pool
//     .query('SELECT * FROM properties LIMIT $1', [limit])
//     .then((result) => {
//       // console.log(result.rows);
//       return result.rows;
//     })
//     .catch((err) => {
//       console.log(err.message);
//     });
// };

const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    // push to queryParams
    // if queryParams.length = 1
    // concactonate WHERE, else AND
    // then concactenate city LIKE $${queryParams.length}
    queryParams.push(`%${options.city}%`);

    if (queryParams.length === 1) {
      queryString +=  `WHERE city LIKE $${queryParams.length} `;
    } else {
      queryString +=  `AND city LIKE $${queryParams.length} `;
    }
  }

 if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    
    if (queryParams.length === 1) {
      queryString +=  `WHERE owner_id LIKE $${queryParams.length} `;
    } else {
      queryString +=  `AND owner_id LIKE $${queryParams.length} `;
    }

  }
  console.log(options);
  // if a minimum_price_per_night and a maximum_price_per_night, 
// only return properties within that price range. (HINT: The database stores amounts in cents, not dollars!)
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

  queryString += `
  GROUP BY properties.id`;

 if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));

    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }



  // 4
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log('test');
  console.log(queryString, queryParams);
  

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};





/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
