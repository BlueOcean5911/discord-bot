import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";
import { Bot } from "./bot.entity";

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private activeClients: Map<string, Client> = new Map();
  private openai;

  constructor(
    @InjectRepository(Bot)
    private botRepository: Repository<Bot>
  ) {
    this.openai = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"],
    });
  }

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
        try {
          const response = await this.openai.chat.completions.create({
            messages: [{ role: "user", content: message.content }],
            model: "gpt-4o",
          });
          await message.reply(response.choices[0].message.content);
        } catch (error) {
          console.log(error);
          this.logger.error("OpenAI API error:", error);
          await message.reply(
            "I'm processing too many requests right now. Please try again in a moment."
          );
        }
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
