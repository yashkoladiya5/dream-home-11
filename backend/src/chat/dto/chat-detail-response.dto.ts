export class ChatDetailResponseDto {
  id: string;
  name: string | null;
  type: string;
  participants: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    joinedAt: Date;
  }[];
  lastMessage: {
    content: string;
    createdAt: Date;
    senderId: string;
  } | null;
  unreadCount: number;
  createdAt: Date;
}
