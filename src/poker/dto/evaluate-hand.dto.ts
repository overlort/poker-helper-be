import { IsArray, ArrayMinSize, ArrayMaxSize, IsString, Matches } from 'class-validator';

export class EvaluateHandDto {
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(7)
  @IsString({ each: true })
  @Matches(/^(10|[2-9JQKA])[CDHS]$/, { each: true })
  cards: string[];
}
