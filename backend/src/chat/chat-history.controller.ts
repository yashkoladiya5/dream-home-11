import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ChatHistoryService } from './chat-history.service';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/chats')
@UseGuards(JwtAuthGuard)
export class ChatHistoryController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

  @Get()
  async getUserChats(@GetUser() user: User) {
    return this.chatHistoryService.getUserChatsWithDetails(user.id);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') chatId: string,
    @Query() query: QueryMessagesDto,
  ) {
    const result = await this.chatHistoryService.getMessages(
      chatId,
      query.page,
      query.limit,
    );
    return {
      data: result.messages,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.page * result.limit < result.total,
      },
    };
  }
}
