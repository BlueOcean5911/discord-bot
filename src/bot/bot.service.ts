import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
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

  async addBot(
    userId: string,
    botToken: string,
    botName: string,
    botDescription: string = ""
  ) {
    const bot = this.botRepository.create({
      userId,
      botToken,
      botName,
      botDescription,
    });
    await this.botRepository.save(bot);
    await this.initializeBot(bot);
    return bot;
  }

  async removeBot(id: number) {
    const bot = await this.botRepository.findOne({ where: { id } });
    if (!bot) {
      throw new HttpException("Bot not found", HttpStatus.NOT_FOUND);
    }

    // Remove from active clients if exists
    if (this.activeClients.has(bot.botToken)) {
      const client = this.activeClients.get(bot.botToken);
      client.destroy();
      this.activeClients.delete(bot.botToken);
    }

    return await this.botRepository.remove(bot);
  }

  async initializeBot(bot: Bot) {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    try {
      await client.login(bot.botToken);
      this.activeClients.set(bot.botToken, client);
      this.logger.log(`Bot ${bot.botName} initialized successfully.`);
    } catch (error) {
      this.logger.error(`Error initializing bot ${bot.botName}: ${error}`);
    }

    // Set up message event listener for this client
    client.on("messageCreate", async (message) => {
      if (message.mentions.has(client.user)) {
        this.logger.log(
          `Bot ${client.user.tag} received message: ${message.content}`
        );
        await message.reply("Hello! How can I assist you today?");
        // try {
        //   const response = await this.openai.chat.completions.create({
        //     messages: [{ role: "user", content: message.content }],
        //     model: "gpt-4o",
        //   });
        //   await message.reply(response.choices[0].message.content);
        // } catch (error) {
        //   console.log(error);
        //   this.logger.error("OpenAI API error:", error);
        //   await message.reply("Sorry, I couldn't process your request.");
        // }
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

  async listBots() {
    return await this.botRepository.find({ where: { isActive: true } });
  }

  getAllClients(): Client[] {
    return Array.from(this.activeClients.values());
  }
}
