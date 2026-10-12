// Frontend/src/components/DriverSideBar.jsx
import React, { useState, useEffect } from "react";
import "../assets/styles/DriverSideBar.css";
import { Auto, Car, Bike, Placeholder } from "../assets/images/Images";
import { useAuth } from "../context/AuthContext";

const DriverSideBar = ({
  setSearching,
  setStartLocation,
  setLocationType,
  setIsAvailable,
  isAvailable,
}) => {
  const { userData } = useAuth();
  const [nav, setNav] = useState(true);
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
                import.meta.env.VITE_GOOGLE_MAPS_API_KEY
              }`
            );
            const data = await res.json();
            if (data.results.length > 0) {
              setStartLocation(data.results[0].formatted_address);
            }
            setLocationType("start");
          } catch (err) {
            console.error("Geocode error:", err);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            alert("Location permission denied. Please enable location access.");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert("Location information is unavailable.");
          } else if (error.code === error.TIMEOUT) {
            alert("The request to get user location timed out.");
          } else {
            alert("An unknown error occurred while fetching location.");
          }
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

const updateDriverAvailability = async (available) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/driver/availability`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: available }),
      }
    );

    if (response.ok) {
      console.log("Availability updated successfully");
    } else {
      console.error("Failed to update availability");
    }
  } catch (error) {
    console.error("Error updating availability:", error);
  }
};

const StartRide = () => {
  handleUseCurrentLocation();
  localStorage.setItem("isAvailable", JSON.stringify(true));
  setIsAvailable(true);
  updateDriverAvailability(true); // Sync with backend
  setNav(false);
  setSearching(true);
};

const StopRide = () => {
  setStartLocation(null);
  localStorage.setItem("isAvailable", JSON.stringify(false));
  setIsAvailable(false);
  updateDriverAvailability(false); // Sync with backend
  setNav(false);
  setStartLocation(null);
  setSearching(false);
};

  return (
    <>
      <div
        style={nav ? { top: "0" } : { top: "-423px" }}
        className="home-sidebar-container driver-sidebar-container"
      >
        <div className="car-details">
          <img
            style={{
              margin:
                userData?.rideType === "Car"
                  ? "-100px 0px 0px 0px"
                  : "-40px 0px -75px 0px",
            }}
            src={
              userData?.rideType === "Car"
                ? Car
                : userData?.rideType === "Bike"
                ? Bike
                : Auto
            }
            alt="vehicle"
          />
          <div>
            <span>{userData?.rideBrand}</span>
            <span>{userData?.rideNumber}</span>
          </div>
        </div>
        <div className="driver-Details">
          <div>
            <img src={userData?.profileImg || Placeholder} alt="driver" />
          </div>
          <h2>
            {userData?.firstName} {userData?.lastName}
          </h2>
          <span>
            <strong>Phone Number: </strong>
            {userData?.phoneNumber}
          </span>
        </div>
        <div style={{ padding: "0px 20px" }} className="search-ride-btn">
          {isAvailable ? (
            <button
              style={{ background: "red", color: "white", cursor: "pointer" }}
              onClick={StopRide}
            >
              Stop search for a ride
            </button>
          ) : (
            <button
              style={{ background: "black", color: "white", cursor: "pointer" }}
              onClick={StartRide}
            >
              Start search for a ride
            </button>
          )}
        </div>
        <button
          onClick={() => setNav((prev) => !prev)}
          style={
            nav
              ? {}
              : {
                  transform: "rotate(-90deg)",
                  borderLeft: "1px solid #cccccc",
                  borderRight: "0px",
                  borderRadius: "8px 0px 0px 8px",
                }
          }
          className="home-sidebar-up-down-btn"
        >
          ❮
        </button>
      </div>
    </>
  );
};

export default DriverSideBar;
