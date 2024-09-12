const db = require("../models");
const { sequelize } = require("../models")
const WebSocket = require('ws');
const axios = require('axios');
const redis = require("../utils/redis")
const { REDIS_KEY_GET_DATA } = require("../constant/redis-key")
const { URL_GET_DATA } = require("../constant/url")

exports.refactoreMe1 = async (req, res) => {
  try {
    // Fetch survey data using a raw SQL query
    const [results] = await db.sequelize.query(`SELECT * FROM "surveys"`);

    // Initialize arrays to hold values for each index
    const indexes = Array.from({ length: 10 }, () => []);

    // Populate index arrays with survey values
    results.forEach(row => {
      row.values.forEach((value, index) => {
        if (indexes[index]) {
          indexes[index].push(value);
        }
      });
    });

    // Calculate the average for each index
    const totalIndex = indexes.map(indexValues =>
      indexValues.reduce((sum, value) => sum + value, 0) / indexValues.length
    );

    // Send the response with the calculated averages
    res.status(200).send({
      statusCode: 200,
      success: true,
      data: totalIndex,
    });
  } catch (error) {
    res.status(500).send({
      statusCode: 500,
      success: false,
      message: 'An error occurred while processing the survey data.',
    });
  }
};

exports.refactoreMe2 = (req, res) => {
  // function ini untuk menjalakan query sql insert dan mengupdate field "dosurvey" yang ada di table user menjadi true, jika melihat data yang di berikan, salah satu usernnya memiliki dosurvey dengan data false
  const { userId, values, id } = req.body;

  const insertSurveyQuery = `
  INSERT INTO surveys ("userId", "values", "createdAt", "updatedAt") 
  VALUES (:userId, ARRAY[:values], NOW(), NOW())
  RETURNING *;
`;

  const updateUserQuery = `
  UPDATE users 
  SET dosurvey = true 
  WHERE id = :id;
`;

  sequelize.transaction(async (t) => {
    try {
      // Insert into surveys table
      const data = await sequelize.query(insertSurveyQuery, {
        replacements: { userId: userId, values: values },
        type: sequelize.QueryTypes.INSERT,
        transaction: t, // Pass the transaction
      });

      // Update users table
      await sequelize.query(updateUserQuery, {
        replacements: { id: id },
        type: sequelize.QueryTypes.UPDATE,
        transaction: t, // Pass the transaction
      });

      res.status(201).send({
        statusCode: 201,
        message: "Survey sent successfully!",
        success: true,
        data: {
          ...data[0][0]
        },
      });

    } catch (error) {
      // Rollback the transaction in case of an error
      await t.rollback();
      res.status(500).send({
        statusCode: 500,
        message: "Cannot post survey.",
        success: false,
      });
    }
  });
};

const _fetchDataFromApi = async () => {
  try {
    const response = await axios.get(URL_GET_DATA); // Replace with the actual API
    return response.data[0];
  } catch (error) {
    return null;
  }
};

const _broadcastData = (data, wss) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

exports.callmeWebSocket = (server) => {
  // Initialize WebSocket Server using the HTTP server
  const wss = new WebSocket.Server({ server });

  // Set up WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Fetch data every 3 minutes and broadcast it to WebSocket clients
  setInterval(async () => {
    const data = await _fetchDataFromApi();
    const values = data.map(item => {
      const sourceCountry = item.sourceCountry.trim() ? `'${item.sourceCountry.trim()}'` : 'NULL';
      const destinationCountry = item.destinationCountry.trim() ? `'${item.destinationCountry.trim()}'` : 'NULL';

      return `(${sourceCountry}, ${destinationCountry}, NOW(), NOW())`;
    }).join(',');
    const query = `INSERT INTO "data" ("sourceCountry", "destinationCountry", "createdAt", "updatedAt") VALUES ${values};`;

    sequelize.query(query, { type: sequelize.QueryTypes.INSERT })
      .then(async () => {
        console.log('Bulk insert successful');
        await redis.del(REDIS_KEY_GET_DATA);
      })
      .catch(error => {
        console.error('Error executing bulk insert:', error);
      });

    if (data) {
      _broadcastData(data, wss);
    }
  }, 3 * 60 * 1000); // Every 3 minutes
};

exports.getData = async (req, res) => {
  try {
    const cachedData = await redis.get(REDIS_KEY_GET_DATA);
    if (cachedData) {
      res.status(200).json({
        success: true,
        statusCode: 200,
        data: JSON.parse(cachedData)
      });

      return
    }

    const sourceCountryQuery = `
    select "sourceCountry", count("sourceCountry") from "data" d 
    where "sourceCountry" is not null
    group by "sourceCountry" 

    `
    const destinationCountryQuery = `
    select "destinationCountry", count("destinationCountry") from "data" d 
    where  "destinationCountry" is not null
    group by "destinationCountry"
    `
    const [sourceCountryResult, destinationCountryResult] = await Promise.all([
      db.sequelize.query(sourceCountryQuery, { type: db.sequelize.QueryTypes.SELECT }),
      db.sequelize.query(destinationCountryQuery, { type: db.sequelize.QueryTypes.SELECT })
    ]);

    const sourceCountryList = sourceCountryResult.map(item => item.sourceCountry)
    const sourceCountryCount = sourceCountryResult.map(item => item.count)
    const destinationCountryList = destinationCountryResult.map(item => item.destinationCountry)
    const destinationCountryCount = destinationCountryResult.map(item => item.count)

    redis.set(REDIS_KEY_GET_DATA, JSON.stringify({
      sourceCountry: {
        label: sourceCountryList,
        total: sourceCountryCount
      },
      destinationCountry: {
        label: destinationCountryList,
        count: destinationCountryCount
      }
    }))

    // Send response
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        sourceCountry: {
          label: sourceCountryList,
          total: sourceCountryCount
        },
        destinationCountry: {
          label: destinationCountryList,
          count: destinationCountryCount
        }
      }
    });
  } catch (error) {
    res.status(500).json(error)
  }
};
