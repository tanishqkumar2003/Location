const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let savedAddresses = [];

app.get("/api/addresses", (req, res) => {
  res.json(savedAddresses);
});

app.post("/api/save-address", (req, res) => {
  const { address, category } = req.body;

  if (!address || !category) {
    return res.status(400).json({ error: "Address and category are required" });
  }

  const newAddress = {
    id: Date.now(),
    address,
    category,
  };

  savedAddresses.push(newAddress);
  res.json({
    success: true,
    message: "Address saved successfully",
    newAddress,
  });
});

app.delete("/api/delete-address/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = savedAddresses.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Address not found" });
  }

  savedAddresses.splice(index, 1);
  res.json({ success: true, message: "Address deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Backend server is running at http://localhost:${PORT}`);
});
