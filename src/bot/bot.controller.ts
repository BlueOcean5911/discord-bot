import { Controller, Post, Body } from "@nestjs/common";
import { BotService } from "./bot.service";

@Controller("bots")
export class BotController {
  constructor(private botService: BotService) {}

  @Post("register")
  async registerBot(
    @Body() data: { userId: string; botToken: string; botName: string }
  ) {
    return this.botService.registerBot(
      data.userId,
      data.botToken,
      data.botName
    );
  }
}
