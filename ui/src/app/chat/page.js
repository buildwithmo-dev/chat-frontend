'use client';
import axios from "axios";
import { useEffect, useState } from "react";
import { CircleUser, MessageCircle, Users, Settings } from 'lucide-react';

export default function Chat() {
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/messages/allchats/', 
            {
                withCredentials: true,
            }
        );
        console.log(response.data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, []);

    return (
        <div className="container-fluid p-0">
            <div className="pb-5" style={{ minHeight: '100vh' }}>
            {/* Chat messages or layout go here */}
            </div>

            <div
            className="d-flex justify-content-around align-items-center bg-white border-top shadow"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '60px',
                zIndex: 1000,
            }}
            >
            <CircleUser title="Status" size={24} />
            <MessageCircle title="Messages" size={24} />
            <Users title="Groups" size={24} />
            <Settings title="Settings" size={24} />
            </div>
        </div>
        );
}
