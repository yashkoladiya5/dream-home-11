import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ChatHistoryService } from './chat-history.service';
import { QueryMessagesDto } from './dto/query-messages.dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatHistoryController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

  @Get()
  async getUserChats(@GetUser('id') userId: string) {
    return this.chatHistoryService.getUserChats(userId);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') chatId: string,
    @Query() query: QueryMessagesDto,
    @GetUser('id') userId: string,
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
