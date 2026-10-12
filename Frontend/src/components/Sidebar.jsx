// Frontend/src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  CircleDot,
  CirclePlus,
  Clock,
  LocateFixed,
  MapPin,
  Menu,
  SquareStop,
  Trash2,
} from "lucide-react";
import PickupTime from "./PickupTime";
import {
  loadGoogleMaps,
  geocodeAddress,
  getPlaceDetails,
} from "../utils/googleMaps";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({
  setPickupTime,
  pickupTime,
  setLocationType,
  startLocation,
  setStartLocation,
  endLocation,
  setEndLocation,
  handleSearch,
  stopLocation,
  setStopLocation,
  setIsSearching,
}) => {
  const [isStopAdded, setIsStopAdded] = useState(false);
  const [isPickupTime, setIsPickupTime] = useState(false);
  const [nav, setNav] = useState(true);
  const [pickupDate, setPickupDate] = useState("Today");
  const [pickupSelection, setPickupSelection] = useState("");
  const [pickupSelectionModel, setPickupSelectionModel] = useState(false);
  const [isFocused, setIsFocused] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    start: "",
    end: "",
    stop: "",
  });
  const containerRef = useRef(null);
  const { userData } = useAuth();
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [mapsReady, setMapsReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsReady(true));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsFocused(null);
        setStartSuggestions([]);
        setEndSuggestions([]);
        setStopSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClear = () => {
    setPickupTime("now");
    setPickupDate("Today");
    setIsPickupTime(false);
  };

  const currentDate = new Date();
  const formattedCurrentDate = currentDate.toISOString().split("T")[0];
  const dateObj = new Date(pickupDate);
  const shortDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

  const validateAddress = async (address, field) => {
    try {
      await geocodeAddress(address);
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (error) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "Invalid address. Please select from suggestions or use map.",
      }));
      return false;
    }
  };

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
              await validateAddress(data.results[0].formatted_address, "start");
            }
            setLocationType("start");
            setIsFocused(null);
          } catch (err) {
            console.error("Geocode error:", err);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error(
            "Permision denied location, please Allow location permission"
          );
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleSuggestionClick = async (suggestion, setLocation, field) => {
    try {
      const address = await getPlaceDetails(suggestion.place_id);
      setLocation(address);
      await validateAddress(address, field);
      setIsFocused(null);

      if (field === "start") setStartSuggestions([]);
      if (field === "end") setEndSuggestions([]);
      if (field === "stop") setStopSuggestions([]);
    } catch (error) {
      console.error("Error getting place details:", error);
      setLocation(suggestion.description);
      await validateAddress(suggestion.description, field);
      setIsFocused(null);
    }
  };

  const getPlaceSuggestions = (input, setSuggestions) => {
    if (!mapsReady || !input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: input,
          componentRestrictions: { country: "pk" },
          types: ["address"],
        },
        (predictions, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch (error) {
      console.error("Error getting place predictions:", error);
      setSuggestions([]);
    }
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const debouncedGetStartSuggestions = debounce(
    (input) => getPlaceSuggestions(input, setStartSuggestions),
    300
  );

  const debouncedGetEndSuggestions = debounce(
    (input) => getPlaceSuggestions(input, setEndSuggestions),
    300
  );

  const debouncedGetStopSuggestions = debounce(
    (input) => getPlaceSuggestions(input, setStopSuggestions),
    300
  );

  const handleStartLocationChange = (e) => {
    const value = e.target.value;
    setStartLocation(value);
    setValidationErrors((prev) => ({ ...prev, start: "" }));
    debouncedGetStartSuggestions(value);
  };

  const handleEndLocationChange = (e) => {
    const value = e.target.value;
    setEndLocation(value);
    setValidationErrors((prev) => ({ ...prev, end: "" }));
    debouncedGetEndSuggestions(value);
  };

  const handleStopLocationChange = (e) => {
    const value = e.target.value;
    setStopLocation(value);
    setValidationErrors((prev) => ({ ...prev, stop: "" }));
    debouncedGetStopSuggestions(value);
  };

  const handleStartLocationBlur = async () => {
    if (startLocation) {
      await validateAddress(startLocation, "start");
    }
  };

  const handleEndLocationBlur = async () => {
    if (endLocation) {
      await validateAddress(endLocation, "end");
    }
  };

  const handleStopLocationBlur = async () => {
    if (stopLocation) {
      await validateAddress(stopLocation, "stop");
    }
  };

  const handleFocus = (id) => {
    setIsFocused(id);

    if (id === "start" && startLocation) {
      debouncedGetStartSuggestions(startLocation);
    } else if (id === "end" && endLocation) {
      debouncedGetEndSuggestions(endLocation);
    } else if (id === "stop" && stopLocation) {
      debouncedGetStopSuggestions(stopLocation);
    }
  };

  const handleSearching = async () => {
    const validations = [];

    if (startLocation) {
      validations.push(validateAddress(startLocation, "start"));
    }
    if (endLocation) {
      validations.push(validateAddress(endLocation, "end"));
    }
    if (stopLocation && isStopAdded) {
      validations.push(validateAddress(stopLocation, "stop"));
    }

    const results = await Promise.all(validations);
    const allValid = results.every((result) => result === true);

    if (allValid) {
      await handleSearch(pickupDate);
      setNav(false);
      setIsSearching(true);
    } else {
      console.log("Please fix invalid addresses");
    }
  };

  return (
    <>
      {!isPickupTime ? (
        <div
          style={nav ? { top: "0" } : { top: "-302px" }}
          className="home-sidebar-container"
          ref={containerRef}
        >
          <span>Get a ride</span>
          <div className="home-sidebar-inputs">
            <CircleDot size={25} fill="black" color="white" />
            <input
              type="text"
              placeholder="Pickup location"
              value={startLocation}
              onChange={handleStartLocationChange}
              onFocus={() => handleFocus("start")}
              onBlur={handleStartLocationBlur}
            />
            {validationErrors.start && (
              <div className="error-message">{validationErrors.start}</div>
            )}
            {isFocused === "start" && (
              <div className="home-sidebar-inputs-location-options">
                {startLocation === "" ? (
                  <>
                    <div onClick={handleUseCurrentLocation}>
                      <span>
                        <MapPin />
                      </span>
                      Use current location
                    </div>
                    <div
                      onClick={() => {
                        setLocationType("start");
                        setIsFocused(null);
                      }}
                    >
                      <span>
                        <LocateFixed />
                      </span>
                      Set location on map
                    </div>
                  </>
                ) : startSuggestions.length > 0 ? (
                  startSuggestions.map((sug) => (
                    <div
                      key={sug.place_id}
                      onClick={() =>
                        handleSuggestionClick(sug, setStartLocation, "start")
                      }
                    >
                      <MapPin /> {sug.description}
                    </div>
                  ))
                ) : (
                  <div>No matches found</div>
                )}
              </div>
            )}
          </div>

          {isStopAdded && (
            <div
              style={nav ? { display: "" } : { display: "none" }}
              className="home-sidebar-inputs"
            >
              <Menu size={30} color="black" />
              <input
                type="text"
                placeholder="Add Stop"
                value={stopLocation}
                onChange={handleStopLocationChange}
                onFocus={() => handleFocus("stop")}
                onBlur={handleStopLocationBlur}
              />
              <Trash2
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setIsStopAdded(false);
                  setStopLocation("");
                  setStopSuggestions([]);
                  setValidationErrors((prev) => ({ ...prev, stop: "" }));
                }}
                size={35}
              />
              {validationErrors.stop && (
                <div className="error-message">{validationErrors.stop}</div>
              )}
              {isFocused === "stop" && (
                <div className="home-sidebar-inputs-location-options">
                  {stopLocation === "" ? (
                    <div
                      onClick={() => {
                        setLocationType("stop");
                        setIsFocused(null);
                      }}
                    >
                      <span>
                        <LocateFixed />
                      </span>
                      Set location on map
                    </div>
                  ) : stopSuggestions.length > 0 ? (
                    stopSuggestions.map((sug) => (
                      <div
                        key={sug.place_id}
                        onClick={() =>
                          handleSuggestionClick(sug, setStopLocation, "stop")
                        }
                      >
                        <MapPin /> {sug.description}
                      </div>
                    ))
                  ) : (
                    <div>No matches found</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="home-sidebar-inputs">
            <SquareStop size={30} fill="black" color="white" />
            <input
              type="text"
              placeholder="Dropoff location"
              value={endLocation}
              onChange={handleEndLocationChange}
              onFocus={() => handleFocus("end")}
              onBlur={handleEndLocationBlur}
            />
            {!isStopAdded && (
              <CirclePlus
                onClick={() => setIsStopAdded(true)}
                size={35}
                style={{ cursor: "pointer" }}
                fill="black"
                color="white"
              />
            )}
            {validationErrors.end && (
              <div className="error-message">{validationErrors.end}</div>
            )}
            {isFocused === "end" && (
              <div className="home-sidebar-inputs-location-options">
                {endLocation === "" ? (
                  <div
                    onClick={() => {
                      setLocationType("end");
                      setIsFocused(null);
                    }}
                  >
                    <span>
                      <LocateFixed />
                    </span>
                    Set location on map
                  </div>
                ) : endSuggestions.length > 0 ? (
                  endSuggestions.map((sug) => (
                    <div
                      key={sug.place_id}
                      onClick={() =>
                        handleSuggestionClick(sug, setEndLocation, "end")
                      }
                    >
                      <MapPin /> {sug.description}
                    </div>
                  ))
                ) : (
                  <div>No matches found</div>
                )}
              </div>
            )}
          </div>

          <div
            onClick={() => setIsPickupTime(true)}
            className="home-sidebar-inputs home-sidebar-selector-inputs"
          >
            <Clock size={25} />
            <p>
              pickup{" "}
              {pickupDate === formattedCurrentDate || pickupDate === "Today"
                ? ""
                : shortDate}{" "}
              {pickupDate !== formattedCurrentDate ? pickupTime : "now"}
            </p>
            <span>❮</span>
          </div>

          <div className="search-ride-btn">
            <button
              onClick={handleSearching}
              disabled={
                !(
                  startLocation &&
                  endLocation &&
                  ((isStopAdded && stopLocation) || !isStopAdded)
                )
              }
              className={
                startLocation &&
                endLocation &&
                ((isStopAdded && stopLocation) || !isStopAdded)
                  ? "active"
                  : ""
              }
            >
              Search
            </button>
          </div>

          <button
            onClick={() => setNav((prev) => !prev)}
            style={
              nav
                ? { transform: "" }
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
      ) : (
        <div className="home-sidebar-container">
          <div className="home-sidebar-header-container">
            <button
              onClick={() => setIsPickupTime(false)}
              className="modal-back-btn"
            >
              ❮
            </button>
            <button onClick={handleClear}>clear</button>
          </div>
          <h1 className="home-sidebar-pickup-title">
            When do you want to be picked up?
          </h1>
          <div
            onClick={() => {
              setPickupSelection("date");
              setPickupSelectionModel(true);
            }}
            className="home-sidebar-inputs home-sidebar-selector-inputs"
          >
            <CalendarDays size={25} />
            <p>{pickupDate === formattedCurrentDate ? "Today" : pickupDate}</p>
            <span>❮</span>
          </div>
          <div
            onClick={() => {
              setPickupSelection("time");
              setPickupSelectionModel(true);
            }}
            className="home-sidebar-inputs home-sidebar-selector-inputs"
          >
            <Clock size={25} />
            <p>{pickupTime === "00:00" ? "now" : pickupTime}</p>
            <span>❮</span>
          </div>
          <div className="search-ride-btn">
            <button onClick={() => setIsPickupTime(false)} className="active">
              Next
            </button>
          </div>
        </div>
      )}
      {pickupSelectionModel && (
        <PickupTime
          setPickupSelectionModel={setPickupSelectionModel}
          setPickupSelection={setPickupSelection}
          pickupSelection={pickupSelection}
          setPickupTime={setPickupTime}
          pickupTime={pickupTime}
          setPickupDate={setPickupDate}
          pickupDate={pickupDate}
        />
      )}
    </>
  );
};

export default Sidebar;
