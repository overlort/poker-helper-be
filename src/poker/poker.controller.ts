import { Controller, Get, Post, Body, Delete } from '@nestjs/common';
import { PokerService } from './poker.service';
import { EvaluateHandDto } from './dto/evaluate-hand.dto';

@Controller('poker')
export class PokerController {
  constructor(private readonly pokerService: PokerService) {}

  @Post('evaluate')
  evaluateHand(@Body() body: EvaluateHandDto) {
    const { cards } = body;
    return this.pokerService.evaluateAndSave(cards);
  }

  @Get('winner')
  getLastWinner() {
    const result = this.pokerService.getLastResult();
    if (!result) return { message: 'No hand has been evaluated yet.' };
    return result;
  }

  @Delete('winner')
  clearWinner() {
    this.pokerService.clearLastResult();
    return { message: 'Last winning combination has been cleared.' };
  }
}