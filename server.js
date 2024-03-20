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

// Endpoint to search for hotels


// Endpoint to retrieve hotel details by location and/or hotel name
app.get("/api/:location/:hotelName?", (req, res) => {
  // Extract location and hotel name from URL params and lowercase them
  let location = req.params.location ? req.params.location.toLowerCase() : null;
  let hotelName = req.params.hotelName
    ? req.params.hotelName.toLowerCase()
    : null;

  if (!location && !hotelName) {
    return res
      .status(400)
      .json({ error: "Location or hotel name parameter is required" });
  }

  const locationsDirectory = path.join(dataDirectory, "api/data");

  fs.readdir(locationsDirectory, (err, locations) => {
    if (err) {
      console.error("Error reading locations directory:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    let foundHotel = false;
    let foundLocation = false;

    // Iterate through each location folder
    locations.forEach((locationFolder) => {
      const locationDirectory = path.join(locationsDirectory, locationFolder);

      // Check if the current location matches the requested location
      if (location && locationFolder.toLowerCase() === location) {
        foundLocation = true;

        // Read the JSON file for the location
        fs.readFile(
          path.join(locationDirectory, `${location}_hotels.json`),
          "utf8",
          (err, data) => {
            if (err) {
              console.error(
                `Error reading JSON file for location ${location}:`,
                err
              );
              return res
                .status(404)
                .json({
                  error: `Location ${location} not found or no hotels available`,
                });
            }

            try {
              const hotels = JSON.parse(data);

              // If hotel name is provided, find and return the hotel details
              if (hotelName) {
                const hotel = hotels.find(
                  (h) => h.name.toLowerCase() === hotelName
                );
                if (hotel) {
                  foundHotel = true;
                  return res.json(hotel);
                }
              } else {
                // If no hotel name is provided, return all hotels for the location
                return res.json(hotels);
              }
            } catch (parseError) {
              console.error("Error parsing JSON:", parseError);
              return res.status(500).json({ error: "Internal server error" });
            }
          }
        );
      }
    });

    // Check if location or hotel was not found
    if (!foundLocation) {
      return res.status(404).json({ error: `Location ${location} not found` });
    }
    if (hotelName && !foundHotel) {
      return res
        .status(404)
        .json({ error: `Hotel ${hotelName} not found in ${location}` });
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
