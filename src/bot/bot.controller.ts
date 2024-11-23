import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { BotService } from "./bot.service";

@Controller("bots")
export class BotController {
  constructor(private botService: BotService) {}

  @Get()
  async listBots() {
    const bots = await this.botService.listBots();
    return bots.map((bot) => ({
      id: bot.id,
      userId: bot.userId,
      botName: bot.botName,
      botDescription: bot.botDescription,
      createdAt: bot.createdAt,
    }));
  }

  @Delete(":id")
  async removeBot(@Param("id") id: number) {
    try {
      return await this.botService.removeBot(id);
    } catch (error) {
      throw new HttpException("Failed to remove bot", HttpStatus.BAD_REQUEST);
    }
  }

  @Post("add")
  async registerBot(
    @Body()
    data: {
      userId: string;
      botToken: string;
      botName: string;
      botDescription: string;
    }
  ) {
    try {
      return await this.botService.addBot(
        data.userId,
        data.botToken,
        data.botName,
        data.botDescription
      );
    } catch (error) {
      if (error.code === "TokenInvalid") {
        throw new HttpException(
          "Invalid Discord bot token provided",
          HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException(
        "Failed to register bot",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
