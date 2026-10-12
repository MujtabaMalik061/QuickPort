// Frontend/src/components/DriverRequest.jsx
import React, { useState } from "react";
import "../assets/styles/Request.css";
import { Placeholder } from "../assets/images/Images";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const DriverRequest = ({ setIsRequest, incomingRide }) => {
  const { userData } = useAuth();
  const socket = useSocket();
  const [isVisible, setIsVisible] = useState(true);
  const [isDetailModel, setIsDetailModel] = useState(false);
  const [ridePrice, setRidePrice] = useState(350);

  const rideData = incomingRide;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsRequest(false), 800);
  };

  const handleReject = () => {
    if (socket && incomingRide?._id) {
      socket.emit("reject-ride", incomingRide._id, userData?._id);
    }
    handleClose();
    toast.error("Ride rejected");
  };

  const handleAccept = () => {
    if (socket && incomingRide) {
      socket.emit(
        "accept-ride",
        incomingRide._id,
        userData,
        ridePrice.toString()
      );
    }
    handleClose();
  };

  const handleIncrease = () => {
    setRidePrice((prev) => prev + 10);
  };
  const handleDecrease = () => {
    setRidePrice((prev) => prev - 10);
  };
  return (
    <>
      <div
        className={`request-container ${
          isVisible ? "fade-in-left" : "fade-in-right"
        }`}
      >
        <div className="request-driver-details">
          <img src={rideData?.riderData?.profileImg || Placeholder} />
          <div>
            <p>
              {rideData?.riderData?.firstName} {rideData?.riderData?.lastName}
            </p>
            <p>{rideData?.riderData?.phoneNumber}</p>
          </div>
          <button
            onClick={() => {
              setIsDetailModel(true);
            }}
          >
            Details
          </button>
        </div>
        <div className="request-details2">
          <p style={{ marginTop: "10px" }}>
            <strong>Time:</strong> {rideData?.rideDetails?.Time}
          </p>
          <p>
            <strong>Total Distance:</strong>{" "}
            {rideData?.rideDetails?.locations?.totalDistance}
          </p>
          <h2 className="price-consolution">
            Price:
            <div>
              <span onClick={handleDecrease}>-10</span>
              <input
                type="text"
                value={ridePrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setRidePrice(value);
                  }
                }}
              />

              <span onClick={handleIncrease}>+10</span>
            </div>
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
                  src={rideData?.riderData?.profileImg || Placeholder}
                  alt=""
                />
                <div>
                  <p>
                    {rideData?.riderData?.firstName}{" "}
                    {rideData?.riderData?.lastName}
                  </p>
                  <p>{rideData?.riderData?.phoneNumber}</p>
                  <p>{rideData?.riderData?.email}</p>
                </div>
              </div>
              <div className="modal-body-location-container">
                <p>
                  <strong>Rider location:</strong>
                  {rideData?.rideDetails?.locations?.riderlocation}
                </p>
                <p>
                  <strong>Start location:</strong>
                  {rideData?.rideDetails?.locations?.start}
                </p>
                <p>
                  <strong>Stop location:</strong>
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
              <h2 className="price-consolution">
                Price:
                <div>
                  <span onClick={handleDecrease}>-10</span>
                  <input
                    type="text"
                    value={ridePrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setRidePrice(value);
                      }
                    }}
                  />

                  <span onClick={handleIncrease}>+10</span>
                </div>
                <span style={{ fontSize: "17px", fontWeight: "600" }}>
                  {" "}
                  Pkr
                </span>
              </h2>
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

export default DriverRequest;
