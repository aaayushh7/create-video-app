import React, { useEffect, useCallback, useState, useRef } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  const playerRef = useRef(null);

  const capture = useCallback(() => {
    const player = playerRef?.current;
  
    if (player) {
      // Set the desired width and height for the canvas
      const canvasWidth = 160; // Adjust to your preference
      const canvasHeight = 90; // Adjust to your preference
  
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const context = canvas.getContext("2d");
  
      // Get the internal video element from the ReactPlayer component
      const videoElement = player.getInternalPlayer();
  
      // Draw the current frame onto the canvas with the new dimensions
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
      // Get the data URL of the canvas
      const imageSrc = canvas.toDataURL("image/png");
  
      console.log(imageSrc);
  
      // Now you can save imageSrc to a JSON file or perform other actions
    }
  }, [playerRef]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
  <h1>Room Page</h1>
  <h4>{remoteSocketId ? "Connected" : "Welcome, please wait"}</h4>
  {myStream && <button onClick={sendStreams}>Send Stream</button>}
  {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}

  {myStream && (
    <div style={{ position: 'absolute', bottom:"5%", zIndex: 1, right: '-1%' }}>
      <h1 style={{color:'white', fontSize:'9px'}}>My Stream</h1>
      <center>
        <ReactPlayer
          playing
          muted
          height="200px"
          width="450px"
          url={myStream}
        />
      </center>
    </div>
  )}

  {remoteStream && (
    <div style={{ position: 'relative' }}>
      <h1 style={{color:'white', fontSize:'14px', padding:'5px'}}>Remote Stream</h1>
      <center>
        <ReactPlayer
          ref={playerRef}
          playing
          muted={false}
          height="520px"
          width="740px"
          url={remoteStream}
          style={{
            borderRadius: '5px',
            border: '4px solid lightblue',
            backgroundColor:'#5A5A5A'
          }}
        />
        <button onClick={capture}>Capture</button>
      </center>
    </div>
  )}
</div>
  );
};

export default RoomPage;


