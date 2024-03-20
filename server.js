const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const port = 4000;

app.use(cors());
app.use(express.json());

// Define the directory where your JSON files are stored
const dataDirectory = path.join(__dirname, "data");

// Serve static files from the data directory
app.use("/data", express.static(dataDirectory));

// Endpoint to search for hotels
app.get("/hotels", (req, res) => {
  // Extract search criteria from query parameters or request body
  const { location} =
    req.query;

  // Logic to fetch hotel data based on search criteria
  // For example, read data from JSON files
  const filename = `${location}_hotels.json`;
  const filepath = path.join(dataDirectory, filename);
  fs.readFile(filepath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return res.status(500).json({ error: "Location not Found" });
    }

    // Parse the JSON data
    const hotels = JSON.parse(data);

    // Send the hotel data as the response
    res.json(hotels);
  });
});

server.listen(port, () => {
  console.log(`Server is alive on port ${port}`);
});
