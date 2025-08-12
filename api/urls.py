from django.urls import path
from . import views

urlpatterns = [
    path('messages/room/<str:room_name>/', views.ChatHistoryView.as_view(), name='room-history'),
    path('messages/dm/<str:username>/', views.DMHistoryView.as_view(), name='dm-history'),
    path('messages/group/<int:group_id>/', views.GroupHistoryView.as_view(), name='group-history'),
    path('messages/allchats/', views.AllUserChatsView.as_view(), name="all_chats")
]
