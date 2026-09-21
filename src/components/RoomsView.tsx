import React from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { ChatroomList } from './ChatroomList.tsx';
import { ChatroomView } from './ChatroomView.tsx';

export const RoomsView: React.FC = () => {
  const { activeRoomId, setActiveRoomId } = useChat();

  if (activeRoomId) {
    return <ChatroomView roomId={activeRoomId} onBack={() => setActiveRoomId(null)} />;
  }

  return <ChatroomList onSelectRoom={(roomId) => setActiveRoomId(roomId)} />;
};
