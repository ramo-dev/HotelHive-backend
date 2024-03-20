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
const dataDirectory = path.join(__dirname, "data");

// Serve static files from the data directory
app.use(express.static(dataDirectory));

// Endpoint to search for hotels
app.get("/api/:location", (req, res) => {
  // Extract location from URL params
  const location = req.params.location;

  if (!location) {
    return res.status(400).json({ error: "Location parameter is required" });
  }

  const filename = `${location.toLowerCase()}_hotels.json`;
  const filepath = path.join(dataDirectory, location, filename);

  fs.readFile(filepath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return res
        .status(404)
        .json({ error: "Location not found or no hotels available" });
    }

    try {
      const hotels = JSON.parse(data);
      res.json(hotels);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      res.status(500).json({ error: "Internal server error" });
    }
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
