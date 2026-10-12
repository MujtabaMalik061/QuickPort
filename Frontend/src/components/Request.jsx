// Frontend/src/components/Request.jsx
import React, { useState, useEffect } from "react";
import "../assets/styles/Request.css";
import { Placeholder, Car, Bike, Auto } from "../assets/images/Images";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const Request = ({ setIsRequest, incomingRide }) => {
  const { userData } = useAuth();
  const socket = useSocket();
  const [isVisible, setIsVisible] = useState(true);
  const [isDetailModel, setIsDetailModel] = useState(false);
  const [rideData, setRideData] = useState(incomingRide);
  useEffect(() => {
    if (!socket) return;

    const onRideUpdated = (updatedRide) => {
      if (rideData?._id && updatedRide._id === rideData._id) {
        setRideData(updatedRide);
      }
    };

    socket.on("ride-updated", onRideUpdated);
    return () => {
      socket.off("ride-updated", onRideUpdated);
    };
  }, [socket, rideData]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsRequest(false), 800);
  };

  const handleReject = () => {
    if (socket && rideData) {
      socket.emit("update-ride-status", {
        rideId: rideData._id,
        riderStatus: "cancelled",
        rideStatus: "cancelled",
        user: userData,
      });
    }
    handleClose();
    toast.error("Ride rejected");
  };

  const handleAccept = () => {
    if (socket && rideData) {
      socket.emit("update-ride-status", {
        rideId: rideData._id,
        riderStatus: "accepted",
        rideStatus: "accepted",
        user: userData,
      });
    }
    handleClose();
    toast.success("Ride accepted");
  };

  // if (!rideData) return null;

  return (
    <>
      <div
        className={`request-container ${
          isVisible ? "fade-in-left" : "fade-in-right"
        }`}
      >
        <div className="request-driver-details">
          <img src={rideData?.driverData?.profileImg || Placeholder} />
          <div>
            <p>
              {rideData?.driverData?.firstName} {rideData?.driverData?.lastName}
            </p>
            <p>{rideData?.driverData?.phoneNumber}</p>
          </div>
          <button
            onClick={() => {
              setIsDetailModel(true);
            }}
          >
            Details
          </button>
        </div>
        <div className="request-ride-details">
          <img
            style={{
              margin:
                rideData?.driverData?.rideType === "Car"
                  ? "-35px 0px 0px 0px"
                  : rideData?.driverData?.rideType === "Bike"
                  ? "-10px 0px -15px 0px"
                  : "-10px 0px -15px 0px",
            }}
            src={
              rideData?.driverData?.rideType === "Car"
                ? Car
                : rideData?.driverData?.rideType === "Bike"
                ? Bike
                : Auto
            }
          />
          <div>
            <p>{rideData?.driverData?.rideNumber}</p>
            <p>
              <strong>Ride:</strong> {rideData?.driverData?.rideBrand}
            </p>
          </div>
        </div>
        <div className="request-details2">
          <p>
            <strong>Total Distance:</strong>{" "}
            {rideData?.rideDetails?.locations?.totalDistance}
          </p>
          <h2>
            Price: {rideData?.price}
            <span style={{ fontSize: "17px", fontWeight: "600" }}> Pkr</span>
          </h2>
        </div>
        <div className="request-action">
          <button onClick={handleReject}>Reject</button>
          <button onClick={handleAccept}>Accept</button>
        </div>
      </div>

      {isDetailModel && (
        <div
          onClick={() => {
            setIsDetailModel(false);
          }}
          className="modal-overlay"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="modal-content"
            style={{ padding: "0px" }}
          >
            <div className="modal-header-2">
              <button
                onClick={() => {
                  setIsDetailModel(false);
                }}
                className="modal-back-btn modal-back-btn-2"
              >
                ❮
              </button>
              <p className="modal-title">Request Details</p>
            </div>
            <div className="modal-body">
              <div className="modal-body-user-container">
                <img
                  src={rideData?.driverData?.profileImg || Placeholder}
                  alt=""
                />
                <div>
                  <p>
                    {rideData?.driverData?.firstName}{" "}
                    {rideData?.driverData?.lastName}
                  </p>
                  <p>{rideData?.driverData?.phoneNumber}</p>
                  <p>{rideData?.driverData?.email}</p>
                </div>
              </div>
              <div className="modal-body-driver-rideinfo-container">
                <img
                  style={{
                    margin:
                      rideData?.driverData?.rideType === "Car"
                        ? "0px 0px 0px 0px"
                        : rideData?.driverData?.rideType === "Bike"
                        ? "-10px 0px -15px 0px"
                        : "-10px 0px -15px 0px",
                  }}
                  src={
                    rideData?.driverData?.rideType === "Car"
                      ? Car
                      : rideData?.driverData?.rideType === "Bike"
                      ? Bike
                      : Auto
                  }
                  alt=""
                />
                <div>
                  <p>
                    <strong>Ride:</strong> {rideData?.driverData?.rideBrand}
                  </p>
                  <p>
                    {" "}
                    <strong>Ride Time:</strong> {rideData?.rideDetails?.Time}
                  </p>
                  <p>
                    {" "}
                    <strong>Ride Number:</strong>{" "}
                    {rideData?.driverData?.rideNumber}
                  </p>
                </div>
              </div>
              <div className="modal-body-location-container">
                <p>
                  <strong> Rider location:</strong>
                  {rideData?.rideDetails?.locations?.riderlocation}
                </p>
                <p>
                  <strong>Start location:</strong>
                  {rideData?.rideDetails?.locations?.start}
                </p>
                <p>
                  <strong> Stop location:</strong>
                  {rideData?.rideDetails?.locations?.stop}
                </p>
                <p>
                  <strong>End location:</strong>
                  {rideData?.rideDetails?.locations?.end}
                </p>
                <p>
                  <strong>Total Distance:</strong>
                  {rideData?.rideDetails?.locations?.totalDistance}
                </p>
              </div>
              <div className="request-action">
                <button onClick={handleReject}>Reject</button>
                <button onClick={handleAccept}>Accept</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Request;
