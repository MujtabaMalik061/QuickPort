// Backend/src/server.js
import express from "express";
import { connectDB } from "./Config/db.js";
import path from "path";
import bodyParser from "body-parser";
import authRoutes from "./Routes/Auth.routes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import Ride from "./Models/Ride_Models.js";
import driverRoutes from "./Routes/Driver.routes.js";

dotenv.config();

const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",")
  : ["http://localhost:5173", "https://quickport-online.vercel.app"];

// Socket.IO setup with CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

connectDB();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "Public")));
const uploadsDir = path.join(__dirname, "Public", "Uploads");

app.use("/Uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.send("QuickPort Backend Working 🚀");
});
app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // --- ROOMS ---
  socket.on("join-room", (userId, role) => {
    if (!userId || !role) {
      console.error("Invalid join-room parameters:", { userId, role });
      return;
    }
    socket.join(`${role}-${userId}`);
    console.log(`User ${userId} joined room as ${role}`);
  });

  // --- RIDER CREATES RIDE ---
  socket.on("ride-request", async (rideData) => {
    try {
      if (!rideData?.riderData?._id) throw new Error("Invalid rider data");
      if (!rideData?.rideDetails?.locations?.start)
        throw new Error("Invalid ride details");

      const newRide = await new Ride(rideData).save();

      const availableDrivers = await findAvailableDrivers();
      availableDrivers.forEach((driver) => {
        io.to(`driver-${driver._id}`).emit("new-ride-request", newRide);
      });

      // tell the rider we saved it
      io.to(`rider-${rideData.riderData._id}`).emit(
        "ride-request-sent",
        newRide
      );
    } catch (error) {
      console.error("Error saving ride request:", error);
      if (rideData?.riderData?._id) {
        io.to(`rider-${rideData.riderData._id}`).emit(
          "ride-request-error",
          error.message || "Failed to send ride request"
        );
      }
    }
  });

  // --- DRIVER ACCEPTS RIDE ---
  socket.on("accept-ride", async (rideId, driverData, price) => {
    try {
      if (!rideId || !driverData?._id) throw new Error("Invalid accept data");

      const updatedRide = await Ride.findByIdAndUpdate(
        rideId,
        {
          driverData, // overwrite with selected driver
          price, // proposed price
          driverStatus: "accepted", // driver accepted
          // keep rideStatus pending until rider accepts
        },
        { new: true }
      );

      if (!updatedRide) throw new Error("Ride not found");

      // notify both sides with the latest ride snapshot
      emitToRideParticipants(io, updatedRide, "ride-accepted", updatedRide);
      emitToRideParticipants(io, updatedRide, "ride-updated", updatedRide);

      // driver-side confirmation channel (optional)
      io.to(`driver-${driverData._id}`).emit(
        "ride-acceptance-confirmed",
        updatedRide
      );
    } catch (error) {
      console.error("Error accepting ride:", error);
      if (driverData?._id) {
        io.to(`driver-${driverData._id}`).emit(
          "ride-acceptance-error",
          error.message || "Failed to accept ride"
        );
      }
    }
  });

  // --- RIDER UPDATES STATUS (accept / cancel) ---
  socket.on("update-ride-status", async (payload) => {
    try {
      const { rideId, riderStatus, rideStatus, user } = payload || {};
      if (!rideId || !user?._id) throw new Error("Invalid update payload");

      const update = {};
      if (riderStatus) update.riderStatus = riderStatus;
      if (rideStatus) update.rideStatus = rideStatus;

      const updatedRide = await Ride.findByIdAndUpdate(rideId, update, {
        new: true,
      });
      if (!updatedRide) throw new Error("Ride not found");

      // broadcast new state to both participants
      emitToRideParticipants(io, updatedRide, "ride-updated", updatedRide);
    } catch (err) {
      console.error("update-ride-status error:", err);
      // you can target the user's room if you pass role here
      socket.emit("ride-update-error", err.message || "Failed to update ride");
    }
  });

  // --- DRIVER REJECTS RIDE (optional flow) ---
  socket.on("reject-ride", async (rideId, driverId) => {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) return;

      // notify the rider (fix: use rider's room, not rideId as before)
      io.to(`rider-${ride.riderData._id}`).emit("ride-rejected", {
        rideId,
        driverId,
      });

      // optionally, persist something (e.g., driverStatus: "rejected")
      // await Ride.findByIdAndUpdate(rideId, { driverStatus: "rejected" });
    } catch (e) {
      console.error("reject-ride error", e);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// helper to emit to both rider and driver if present
function emitToRideParticipants(io, ride, event, data) {
  if (ride?.riderData?._id)
    io.to(`rider-${ride.riderData._id}`).emit(event, data);
  if (ride?.driverData?._id)
    io.to(`driver-${ride.driverData._id}`).emit(event, data);
}


async function findAvailableDrivers() {
  try {
    const Driver = (await import("./Models/Driver_Models.js")).default;

    const availableDrivers = await Driver.find({
      isAvailable: true,
    });

    console.log("Available drivers:", availableDrivers.length);
    return availableDrivers;
  } catch (error) {
    console.error("Error finding available drivers:", error);
    return [];
  }
}

if (process.env.NODE_ENV !== "production") {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
