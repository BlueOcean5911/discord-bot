import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DiscordModule } from "@discord-nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GatewayIntentBits } from "discord.js";
import { BotModule } from "./bot/bot.module";
import { Bot } from "./bot/bot.entity";
import { BotService } from "./bot/bot.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Bot],
      synchronize: true,
    }),
    BotModule,
  ],
})
export class AppModule {}
