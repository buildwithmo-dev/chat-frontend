import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from .models import Room, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    # Called when the WebSocket connection is established
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]  # e.g., "dm_alice_bob" or "group_devs"
        self.room_group_name = f"chat_{self.room_name}"
        self.user = self.scope["user"]

        # Ensure the room exists in DB
        await self.get_or_create_room(self.room_name)

        # Check if the connected user is a participant of this room
        if not await self.is_user_in_room():
            await self.close()  # reject the connection if not authorized
        else:
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)  # join room group
            await self.accept()  # accept WebSocket connection

    # Called when the WebSocket connection is closed
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)  # leave the group

    # Called when a message is received from the WebSocket frontend
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data["message"]
        sender = self.user.username if self.user.is_authenticated else "Anonymous"

        # Save the message in the database
        await self.save_message(message)

        # Send the message to the group so other participants receive it
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",  # handled by self.chat_message()
                "message": message,
                "user": sender,
            }
        )

    # Called when a group message is received; sends it to the WebSocket client
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "user": event["user"],
        }))

    # --- Utility methods to interact with database (run in sync thread pool) ---

    # Get or create a chat room by name
    @sync_to_async
    def get_or_create_room(self, room_name):
        self.room, _ = Room.objects.get_or_create(name=room_name)

    # Check if the user is a participant in the room
    @sync_to_async
    def is_user_in_room(self):
        return self.room.participants.filter(id=self.user.id).exists()

    # Save a new message to the database
    @sync_to_async
    def save_message(self, content):
        return Message.objects.create(room=self.room, sender=self.user, content=content)
