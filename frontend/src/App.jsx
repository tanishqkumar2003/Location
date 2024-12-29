import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import axios from "axios";
import { BACKEND_URL } from "./config";
import './index.css';
// import TestComponent from "./test";

const mapContainerStyle = { width: "100%", height: "400px", borderRadius: "8px" };
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
      const { data } = await axios.get(`${BACKEND_URL}/addresses`);
      setSavedAddresses(data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  // Handle "Locate Me" to fetch user's current location
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Update the current position
          setCurrentPosition({ lat: latitude, lng: longitude });

          // Fetch the address from coordinates and update the address state
          try {
            const apiKey = "your api"; // Replace with your API key
            const response = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );

            if (response.data.results.length > 0) {
              const fetchedAddress = response.data.results[0].formatted_address;
              setAddress(fetchedAddress);
            } else {
              setAddress("Unable to fetch address.");
            }
          } catch (error) {
            console.error("Error fetching address:", error);
            setAddress("Error fetching address.");
          }
        },
        (error) => {
          alert("Location permission denied or unavailable.");
          console.error("Error fetching location:", error);
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
    const apiKey = "your api"; // Replace with your API key
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
      await axios.post(`${BACKEND_URL}/save-address`, {
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
      await axios.delete(`${BACKEND_URL}/delete-address/${id}`);
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  return (
    <>
      {/* <TestComponent/> */}
      <LoadScript googleMapsApiKey="your api" libraries={["places"]}>
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 min-h-screen p-8">
          <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-lg">
            <h1 className="text-7xl font-bold mb-6 text-center text-purple-700">
              Location Selector
            </h1>
            <div className="bg-red-500 text-white p-4">Test Tailwind</div>


            {/* Autocomplete Search */}
            <Autocomplete
              onLoad={(auto) => setAutocomplete(auto)}
              onPlaceChanged={handlePlaceChanged}
            >
              <input
                type="text"
                placeholder="Search for an address"
                className="w-full p-4 border border-gray-300 rounded-lg mb-6 shadow focus:outline-none focus:ring-4 focus:ring-purple-400"
              />
            </Autocomplete>

            {/* Locate Me Button */}
            <div className="text-center mb-8">
              <button
                onClick={handleLocateMe}
                className="bg-gradient-to-br from-blue-500 to-purple-500 text-white py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-all duration-300"
              >
                Locate Me
              </button>
            </div>

            {/* Display Selected Address */}
            <p className="text-lg font-medium text-gray-800 mb-8 bg-purple-100 p-4 rounded-lg shadow">
              <strong>Current Address:</strong> {address || "No address selected"}
            </p>

            {/* Google Map */}
            <div className="overflow-hidden rounded-lg shadow-lg mb-8 border-4 border-purple-300">
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
            </div>

            {/* Address Form */}
            <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg shadow mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-purple-800">Save Address</h2>
              <div className="flex items-center gap-4">
                <select
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">Select Category</option>
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Friends & Family">Friends & Family</option>
                </select>
                <button
                  onClick={saveAddress}
                  className="bg-gradient-to-br from-green-500 to-teal-500 text-white py-3 px-6 rounded-full shadow-lg hover:opacity-90 transition-all duration-300"
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
                    className="bg-gradient-to-br from-red-500 to-pink-500 text-white py-2 px-4 rounded-lg shadow-md hover:opacity-90 transition-all duration-300"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LoadScript>
    </>
  );
};

export default App;
