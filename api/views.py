from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Room, Message
from .serializers import MessageSerializer

User = get_user_model()

class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_name):
        try:
            room = Room.objects.get(name=room_name)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

        messages = room.messages.order_by("-timestamp")[:50]
        return Response(MessageSerializer(messages, many=True).data)

class DMHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        messages = Message.objects.filter(
            sender__in=[user, target_user],
            receiver__in=[user, target_user],
            group__isnull=True
        ).order_by('-timestamp')[:50]

        return Response(MessageSerializer(messages, many=True).data)

class GroupHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        try:
            group = Room.objects.get(id=group_id)
        except Room.DoesNotExist:
            return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        messages = Message.objects.filter(group=group).order_by('-timestamp')[:50]
        return Response(MessageSerializer(messages, many=True).data)

class AllUserChatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_rooms = Room.objects.filter(participants=user)

        group_rooms = user_rooms.filter(is_group=True)
        dm_rooms = user_rooms.filter(is_group=False)

        group_messages = Message.objects.filter(room__in=group_rooms).order_by('-timestamp')[:50]
        dm_messages = Message.objects.filter(room__in=dm_rooms).order_by('-timestamp')[:50]

        return Response({
            "group_messages": MessageSerializer(group_messages, many=True).data,
            "dm_messages": MessageSerializer(dm_messages, many=True).data,
        })
