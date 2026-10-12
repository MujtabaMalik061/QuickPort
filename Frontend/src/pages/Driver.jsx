// Frontend/src/pages/Driver.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Placeholder, WhiteLogo } from "../assets/images/Images";
import "../assets/styles/Home.css";
import UpdateUserDetails from "../components/UpdateUserDetails";
import Map from "../components/Map";
import DriverSideBar from "../components/DriverSideBar";
import DriverBottom from "../components/DriverBottom";
import DriverRequest from "../components/DriverRequest";

const Driver = () => {
  const { userData } = useAuth();
   const socket = useSocket();
   const [incomingRide, setIncomingRide] = useState(null);
  const [isRequest, setIsRequest] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isProfileDetails, setIsProfileDetails] = useState(false);
  const [locationType, setLocationType] = useState(null);
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [stopLocation, setStopLocation] = useState("");
  const [isAvailable, setIsAvailable] = useState(
    JSON.parse(localStorage.getItem("isAvailable")) || false
  );

    useEffect(() => {
      if (socket) {
        socket.on("new-ride-request", (rideData) => {
          console.log("New ride request", rideData);
          setIncomingRide(rideData);
          setIsRequest(true);
        });

        socket.on("ride-acceptance-confirmed", (rideData) => {
          console.log("Ride acceptance confirmed", rideData);
          setIsRequest(false);
          setIsAvailable(false);
          localStorage.setItem("isAvailable", JSON.stringify(false));
        });

        socket.on("ride-acceptance-error", (error) => {
          console.error("Ride acceptance failed", error);
        });

        return () => {
          socket.off("new-ride-request");
          socket.off("ride-acceptance-confirmed");
          socket.off("ride-acceptance-error");
        };
      }
    }, [socket]);

  useEffect(() => {
    localStorage.setItem("isAvailable", JSON.stringify(isAvailable));
  }, [isAvailable]);

  return (
    <div className="home-container">
      <div className="auth-header">
        <div>
          <img src={WhiteLogo} alt="logo" />
          <span>QuickPort</span>
        </div>
        <div
          className="header-user-info"
          onClick={() => setIsProfileDetails(true)}
        >
          <div>
            <img src={userData.profileImg || Placeholder} />
            <span>{userData.firstName || "Guest"}</span>
          </div>
          <span>❮</span>
        </div>
      </div>
      <div className="home-main-container">
        {!isAvailable && (
          <DriverSideBar
            isAvailable={isAvailable}
            setIsAvailable={setIsAvailable}
            setSearching={setSearching}
            setLocationType={setLocationType}
            locationType={locationType}
            startLocation={startLocation}
            setStartLocation={setStartLocation}
            endLocation={endLocation}
            setEndLocation={setEndLocation}
            stopLocation={stopLocation}
            setStopLocation={setStopLocation}
          />
        )}
        <Map
          setLocationType={setLocationType}
          locationType={locationType}
          startLocation={startLocation}
          setStartLocation={setStartLocation}
          endLocation={endLocation}
          setEndLocation={setEndLocation}
          stopLocation={stopLocation}
          setStopLocation={setStopLocation}
        />
        {isAvailable && (
          <DriverBottom
            isAvailable={isAvailable}
            setIsAvailable={setIsAvailable}
            startLocation={startLocation}
            setIsSearching={setSearching}
          />
        )}
      </div>
      {isAvailable && isRequest && (
        <DriverRequest
          setIsRequest={setIsRequest}
          isRequest={isRequest}
          incomingRide={incomingRide}
        />
      )}
      {isProfileDetails && (
        <UpdateUserDetails setIsProfileDetails={setIsProfileDetails} />
      )}
    </div>
  );
};

export default Driver;
