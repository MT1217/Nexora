import { io } from 'socket.io-client';

let socket = null;

export const initiateSocketConnection = (token) => {
  if (socket) return socket;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  
  socket = io(backendUrl, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  console.log('Socket Connection Initiated');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting Socket...');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
export default socket;
