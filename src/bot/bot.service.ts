import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client, GatewayIntentBits } from "discord.js";
import { Bot } from "./bot.entity";

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private activeClients: Map<string, Client> = new Map();

  constructor(
    @InjectRepository(Bot)
    private botRepository: Repository<Bot>
  ) {}

  async registerBot(userId: string, botToken: string, botName: string) {
    const bot = this.botRepository.create({
      userId,
      botToken,
      botName,
    });
    await this.botRepository.save(bot);
    await this.initializeBot(bot);
    return bot;
  }

  async initializeBot(bot: Bot) {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    await client.login(bot.botToken);
    this.activeClients.set(bot.botToken, client);

    // Set up message event listener for this client
    client.on("messageCreate", async (message) => {
      if (message.mentions.has(client.user)) {
        this.logger.log(
          `Bot ${client.user.tag} received message: ${message.content}`
        );
        await message.reply("Message processed successfully");
      }
    });

    return client;
  }

  async initializeAllBots() {
    const bots = await this.botRepository.find({ where: { isActive: true } });
    for (const bot of bots) {
      await this.initializeBot(bot);
    }
  }

  getAllClients(): Client[] {
    return Array.from(this.activeClients.values());
  }
}
