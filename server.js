const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises; // Using promises for async/await
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Define the directory where your JSON files are stored
const dataDirectory = path.join(__dirname, "api/data");

// Serve static files from the data directory (optional)
// app.use(express.static(dataDirectory));

// Endpoint to retrieve hotels by location or hotel name
app.get("/api/:locationOrName", async (req, res) => {
  const searchTerm = req.params.locationOrName.toLowerCase();

  // Check if user provided a location
  if (
    fs.existsSync(
      path.join(dataDirectory, searchTerm, `${searchTerm}_hotels.json`)
    )
  ) {
    // Read location's JSON file
    try {
      const filePath = path.join(
        dataDirectory,
        searchTerm,
        `${searchTerm}_hotels.json`
      );
      const hotels = await fs.readFile(filePath, "utf8");
      return res.json(JSON.parse(hotels));
    } catch (err) {
      console.error(`Error reading JSON file for location ${searchTerm}:`, err);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    // User provided a hotel name, search across all locations
    let allHotels = [];
    try {
      // Get a list of all folders in the data directory (locations)
      const locations = await fs.readdir(dataDirectory);

      for (const location of locations) {
        const filePath = path.join(
          dataDirectory,
          location,
          `${location}_hotels.json`
        );
        // Read each location's JSON file
        const hotels = JSON.parse(await fs.readFile(filePath, "utf8"));
        // Filter hotels by name
        const matchingHotels = hotels.filter(
          (h) => h.name.toLowerCase() === searchTerm
        );
        allHotels = allHotels.concat(matchingHotels);
      }

      if (allHotels.length === 0) {
        return res
          .status(404)
          .json({ error: `Hotel ${searchTerm} not found in any location` });
      }

      return res.json(allHotels);
    } catch (err) {
      console.error("Error reading location directory or parsing JSON:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
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
