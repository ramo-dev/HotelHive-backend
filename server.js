const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
const port = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

const dataDirectory = path.join(__dirname, "api/data");

app.get("/api/search/:query", async (req, res) => {
  const query = req.params.query.toLowerCase();
  let foundLocations = [];

  try {
    // Check if the query corresponds to a location
    const locations = await fs.readdir(dataDirectory);
    for (const location of locations) {
      const locationPath = path.join(dataDirectory, location);
      const stats = await fs.stat(locationPath);
      if (stats.isDirectory() && location.toLowerCase().includes(query)) {
        const filePath = path.join(locationPath, `${location}_hotels.json`);
        const hotelsData = await fs.readFile(filePath, "utf8");
        const hotels = JSON.parse(hotelsData);
        foundLocations = foundLocations.concat(
          hotels.map((hotel) => ({
            ...hotel,
            location,
          }))
        );
      }
    }

    if (foundLocations.length > 0) {
      return res.json(foundLocations);
    }

    // If no locations were found, search for hotels by name across all locations
    let namedHotels = [];
    for (const location of locations) {
      const locationPath = path.join(dataDirectory, location);
      const filePath = path.join(locationPath, `${location}_hotels.json`);

      // Check if the file exists before trying to read it
      if (
        await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false)
      ) {
        const hotelsData = await fs.readFile(filePath, "utf8");
        const hotels = JSON.parse(hotelsData);
        const matchingHotels = hotels.filter(
          (h) => h.title && h.title.toLowerCase().includes(query)
        );
        namedHotels = namedHotels.concat(
          matchingHotels.map((hotel) => ({ ...hotel, location }))
        );
      }
    }

    if (namedHotels.length > 0) {
      return res.json(namedHotels);
    }

    return res
      .status(404)
      .json({ error: `No locations or hotels found matching ${query}` });
  } catch (err) {
    console.error("Error reading location directory or parsing JSON:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/*", (req, res) => {
  res.status(404).json({ error: "Invalid API endpoint" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

server.listen(port, () => {
  console.log(`Server is alive on port ${port}`);
});
