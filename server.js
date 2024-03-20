const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Define the directory where your JSON files are stored
const dataDirectory = path.join(__dirname, "api/data");

// Serve static files from the data directory
app.use(express.static(dataDirectory));

// Endpoint to retrieve all hotels in a specific location
app.get("/api/location/:location", (req, res) => {
  const location = req.params.location.toLowerCase();

  if (!location) {
    return res.status(400).json({ error: "Location parameter is required" });
  }

  const filePath = path.join(
    dataDirectory,
    location,
    `${location}_hotels.json`
  );

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading JSON file for location ${location}:`, err);
      return res
        .status(404)
        .json({
          error: `Location ${location} not found or no hotels available`,
        });
    }

    try {
      const hotels = JSON.parse(data);
      return res.json(hotels);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// Endpoint to retrieve hotel details by hotel name across all locations
app.get("/api/hotel/:hotelName", (req, res) => {
  const hotelName = req.params.hotelName.toLowerCase();

  if (!hotelName) {
    return res.status(400).json({ error: "Hotel name parameter is required" });
  }

  let allHotels = [];

  // Read all JSON files in the data directory
  fs.readdir(dataDirectory, (err, locations) => {
    if (err) {
      console.error("Error reading locations directory:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    locations.forEach((location) => {
      const filePath = path.join(
        dataDirectory,
        location,
        `${location}_hotels.json`
      );

      try {
        const hotels = JSON.parse(fs.readFileSync(filePath, "utf8"));
        allHotels = allHotels.concat(
          hotels.filter((h) => h.name.toLowerCase() === hotelName)
        );
      } catch (parseError) {
        console.error(
          `Error parsing JSON file for location ${location}:`,
          parseError
        );
      }
    });

    if (allHotels.length === 0) {
      return res
        .status(404)
        .json({ error: `Hotel ${hotelName} not found in any location` });
    }

    return res.json(allHotels);
  });
});

// Catch-all route for invalid API endpoints
app.get("/api/*", (req, res) => {
  res.status(404).json({ error: "Invalid API endpoint" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

server.listen(port, () => {
  console.log(`Server is alive on port ${port}`);
});
