import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BotGateway } from "./bot.gateway";
import { BotService } from "./bot.service";
import { BotController } from "./bot.controller";
import { Bot } from "./bot.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Bot])],
  controllers: [BotController],
  providers: [BotService, BotGateway],
  exports: [BotService],
})
export class BotModule {
  constructor(private botService: BotService) {
    // Initialize all registered bots when module starts
    this.botService.initializeAllBots();
  }
}
