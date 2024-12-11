import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import axios from "axios";

const mapContainerStyle = { width: "100%", height: "400px" };
const center = { lat: 20.5937, lng: 78.9629 }; // Default center (India)

const App = () => {
  const [currentPosition, setCurrentPosition] = useState(center); // Map center
  const [autocomplete, setAutocomplete] = useState(null); // Autocomplete reference
  const [address, setAddress] = useState(""); // Selected address
  const [category, setCategory] = useState(""); // Address category
  const [savedAddresses, setSavedAddresses] = useState([]); // Saved addresses list

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Fetch saved addresses from the backend
  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/addresses");
      setSavedAddresses(data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  // Handle "Locate Me" to fetch user's current location
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ lat: latitude, lng: longitude });
          fetchAddressFromCoords(latitude, longitude);
        },
        () => {
          alert("Location permission denied or unavailable.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Handle autocomplete selection
  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setCurrentPosition({ lat, lng });
      setAddress(place.formatted_address);
    }
  };

  // Fetch address from coordinates using Google Geocoding API
  const fetchAddressFromCoords = async (lat, lng) => {
    const apiKey = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with your API key
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      if (response.data.results.length > 0) {
        setAddress(response.data.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  // Handle marker drag to update the address
  const handleMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCurrentPosition({ lat, lng });
    fetchAddressFromCoords(lat, lng);
  };

  // Save the address to the backend
  const saveAddress = async () => {
    if (!address || !category) {
      alert("Please provide a valid address and select a category.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/save-address", {
        address,
        category,
      });
      alert("Address saved successfully!");
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address.");
    }
  };

  // Delete a saved address
  const deleteAddress = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/delete-address/${id}`);
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY" libraries={["places"]}>
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-semibold mb-6 text-center text-blue-600">
          Location Selection Interface
        </h1>

        {/* Autocomplete Search */}
        <Autocomplete
          onLoad={(auto) => setAutocomplete(auto)}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for an address"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Autocomplete>

        {/* Locate Me Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleLocateMe}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Locate Me
          </button>
        </div>

        {/* Display Selected Address */}
        <p className="text-lg font-medium text-gray-700 mb-6">
          <strong>Current Address:</strong> {address || "No address selected"}
        </p>

        {/* Google Map */}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentPosition}
          zoom={15}
        >
          <Marker
            position={currentPosition}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
        </GoogleMap>

        {/* Address Form */}
        <div className="mt-6 mb-6 p-4 border border-gray-300 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Save Address</h2>
          <div className="flex mb-4">
            <select
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-md p-2 mr-4 w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Friends & Family">Friends & Family</option>
            </select>
            <button
              onClick={saveAddress}
              className="bg-green-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-green-700 transition duration-300"
            >
              Save Address
            </button>
          </div>
        </div>

        {/* Saved Addresses */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Saved Addresses</h2>
        <ul className="space-y-4">
          {savedAddresses.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-md hover:bg-gray-200"
            >
              <span className="text-gray-700">{item.address} ({item.category})</span>
              <button
                onClick={() => deleteAddress(item.id)}
                className="bg-red-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition duration-300"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </LoadScript>
  );
};

export default App;
