/**********************************
 * ITE5315 – Assignment 2
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source (including web sites) or distributed to other students.
 *
 * Name: Deep Patel Student ID: N01679203 Date: 28/10/2025
 *
 **********************************/

const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const fs = require("fs").promises;

const app = express();
const port = process.env.port || 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Handlebars
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    helpers: {
      // Custom helper to format price (remove $ and trim)
      formatPrice: function (price) {
        if (!price) return "N/A";
        return price.toString().replace("$", "").trim();
      },
      // Custom helper to check if value is empty
      isEmpty: function (value) {
        return !value || value.toString().trim() === "";
      },
    },
  })
);
app.set("view engine", "hbs");
app.set('views', path.join(__dirname, 'views'));

// Load Airbnb data with better error handling
let airbnbData = [];

async function loadData() {
  try {
    console.log('Current directory:', process.cwd());
    console.log('Files in directory:', await fs.readdir(process.cwd()));

    const filePath = path.join(process.cwd(), 'airbnb_with_photos.json');
    console.log('Looking for file at:', filePath);

    const data = await fs.readFile(filePath, 'utf8');
    airbnbData = JSON.parse(data);
    console.log(`Successfully loaded ${airbnbData.length} records from JSON file`);
  } catch (error) {
    console.error("Error loading JSON data file:", error.message);
    console.log("Using sample data instead");
    airbnbData = sampleData;
  }
}

// Initialize data
loadData();

// Home route
app.get("/", function (req, res) {
  res.render("index", { title: "Airbnb Property Explorer" });
});

// Users route
app.get("/users", function (req, res) {
  res.send("respond with a resource");
});

// Step 8: View all data route
app.get("/viewData", (req, res) => {
  const dataToShow = airbnbData.slice(0, 100); // Show first 100 records
  res.render("viewData", {
    title: "All Airbnb Properties",
    data: dataToShow,
  });
});

// Step 9: Clean data route (remove empty names)
app.get("/viewData/clean", (req, res) => {
  const cleanData = airbnbData
    .filter((item) => item.NAME && item.NAME.trim() !== "")
    .slice(0, 100);

  res.render("viewData", {
    title: "Cleaned Airbnb Data",
    data: cleanData,
  });
});

// Step 11: Price range search form
app.get("/viewData/price", (req, res) => {
  res.render("priceSearch", {
    title: "Search by Price Range",
  });
});

// Price search results
app.post("/viewData/price/results", (req, res) => {
  const minPrice = parseFloat(req.body.minPrice) || 0;
  const maxPrice = parseFloat(req.body.maxPrice) || 10000;

  const results = airbnbData
    .filter((item) => {
      const price = parseFloat(item.price?.replace("$", "")) || 0;
      return price >= minPrice && price <= maxPrice;
    })
    .slice(0, 100);

  res.render("priceResults", {
    title: "Price Range Results",
    results: results,
    minPrice: minPrice,
    maxPrice: maxPrice,
  });
});

// Assignment 1 routes recreated with Handlebars
app.get("/allData", (req, res) => {
  const dataToShow = airbnbData.slice(0, 50);
  res.render("allData", {
    title: "All Data - Assignment 1",
    data: dataToShow,
  });
});

// Search form page
app.get("/search/propertyLine", (req, res) => {
  res.render("searchForm", {
    title: "Search Properties",
  });
});

// Search results
app.get("/search/propertyLine/results", (req, res) => {
  const searchTerm = req.query.searchTerm?.toLowerCase() || "";
  const results = airbnbData
    .filter(
      (item) =>
        item.NAME?.toLowerCase().includes(searchTerm) ||
        item.neighbourhood?.toLowerCase().includes(searchTerm) ||
        item.property_type?.toLowerCase().includes(searchTerm)
    )
    .slice(0, 100);

  res.render("searchResults", {
    title: "Search Results",
    searchTerm,
    results,
  });
});

// Search by Property ID form (support with and without trailing slash)
app.get(["/search/id", "/search/id/"], (req, res) => {
  res.render("searchByIdForm", {
    title: "Search by Property ID",
  });
});

// Search by Property ID results (validation + sanitization)
app.get("/search/id/results", (req, res) => {
  const raw = req.query.propertyId;
  const propertyId = (raw || "").toString().trim();

  if (!propertyId) {
    return res.status(400).render("searchByIdForm", {
      title: "Search by Property ID",
      error: "Please provide a property ID to search.",
    });
  }

  if (propertyId.length > 50) {
    return res.status(400).render("searchByIdForm", {
      title: "Search by Property ID",
      error: "Property ID is too long.",
    });
  }

  // perform search against both 'id' and '_id' fields (coerce to string)
  const results = (airbnbData || [])
    .filter((item) => {
      const id1 = item._id?.toString() || "";
      const id2 = item.id?.toString() || "";
      return id1.includes(propertyId) || id2.includes(propertyId);
    })
    .slice(0, 100);

  res.render("searchByIdResults", {
    title: "Search Results - Property ID",
    propertyId,
    results,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Error",
    message: "Page Not Found",
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
