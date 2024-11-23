import { InjectDiscordClient, On, Once } from "@discord-nestjs/core";
import { Injectable, Logger, UseGuards, UseInterceptors } from "@nestjs/common";
import { Client, Message } from "discord.js";
import { MessageFromUserGuard } from "./guards/message-from-user.guard";
import { MessageToUpperInterceptor } from "./interceptors/message-to-upper.interceptor";
import { BotService } from "./bot.service";

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  constructor(private readonly botService: BotService) {}

  @Once("ready")
  onReady() {
    const clients = this.botService.getAllClients();
    for (const client of clients) {
      this.logger.log(`Bot ${client.user.tag} was started!`);
    }
  }

  @On("messageCreate")
  @UseGuards(MessageFromUserGuard)
  @UseInterceptors(MessageToUpperInterceptor)
  async onMessage(message: Message): Promise<void> {
    console.log("here---->");
    const clients = this.botService.getAllClients();
    const mentionedBot = clients.find((client) =>
      message.mentions.has(client.user)
    );

    if (mentionedBot) {
      this.logger.log(
        `Incoming message for ${mentionedBot.user.tag}: ${message.content}`
      );
      await message.reply("Message processed successfully");
    }
  }
}
