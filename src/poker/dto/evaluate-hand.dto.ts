import { Card } from '../card.interface';
import { IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class CardDto {
  @IsIn(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'])
  rank: string;

  @IsIn(['♠', '♥', '♦', '♣'])
  suit: string;
}

export class EvaluateHandDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardDto)
  cards: Card[];
}