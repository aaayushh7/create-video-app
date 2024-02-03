import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#EBD9B4",
      }}
    >
      <h1 style={{ marginBottom: "2rem" }}>LOBBY</h1>
      <Box
        component="form"
        onSubmit={handleSubmitForm}
        sx={{
          "& .MuiTextField-root": { m: 1, width: "25ch" },
        }}
        noValidate
        autoComplete="off"
      >
        <div>
          <label htmlFor="email">Email ID</label>
          <br></br>
          <TextField
            required
            id="filled-required"
            label="Required"
            variant="filled"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br></br>
          <br />
          <label htmlFor="room">Room Number</label>
          <br></br>
          <div>
            <TextField
              required
              id="filled-required"
              label="Required"
              variant="filled"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
        </div>
        <br />
        <br></br>
        <Stack direction="row" spacing={2} justifyContent={"center"}>
          <Button variant="contained" type="submit">
            JOIN
          </Button>
        </Stack>
      </Box>
    </div>
  );
};

export default LobbyScreen;