import { Injectable } from '@nestjs/common';
import { Card, Rank } from './card.interface';

@Injectable()
export class PokerService {
  private rankOrder: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  private lastResult: { combination: string; bestCards: Card[] } | null = null;

  evaluateAndSave(cards: Card[]): { combination: string; bestCards: Card[] } {
    if (cards.length < 5 || cards.length > 7) {
      throw new Error("Hand must have between 5 and 7 cards.");
    }

    const combinations = this.getAllFiveCardCombos(cards);
    const rankedHands = combinations.map(combo => {
      const name = this.classifyHand(combo);
      return {
        combo,
        name,
        rank: this.getHandRank(name),
      };
    });

    rankedHands.sort((a, b) => b.rank - a.rank);
    const best = rankedHands[0];

    this.lastResult = {
      combination: best.name,
      bestCards: best.combo,
    };

    return this.lastResult;
  }

  getLastResult(): { combination: string; bestCards: Card[] } | null {
    return this.lastResult;
  }

  private getAllFiveCardCombos(cards: Card[]): Card[][] {
    const result: Card[][] = [];
    const combine = (start: number, path: Card[]) => {
      if (path.length === 5) {
        result.push([...path]);
        return;
      }
      for (let i = start; i < cards.length; i++) {
        path.push(cards[i]);
        combine(i + 1, path);
        path.pop();
      }
    };
    combine(0, []);
    return result;
  }

  private getRankValue(rank: Rank): number {
    return this.rankOrder.indexOf(rank);
  }

  private classifyHand(cards: Card[]): string {
    const counts: Record<string, number> = {};
    const suits: Record<string, Card[]> = {};
    const values: number[] = [];

    for (let card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
      suits[card.suit] = suits[card.suit] || [];
      suits[card.suit].push(card);
      values.push(this.getRankValue(card.rank));
    }

    values.sort((a, b) => a - b);
    const isFlush = Object.values(suits).some(suitCards => suitCards.length >= 5);
    const isStraight = this.checkStraight(values);
    const flushCards = Object.values(suits).find(s => s.length >= 5);

    if (isFlush && flushCards) {
      const flushValues = flushCards.map(card => this.getRankValue(card.rank)).sort((a, b) => a - b);
      if (this.checkStraight(flushValues)) {
        if (flushValues.includes(8) && flushValues.includes(9) && flushValues.includes(10) &&
          flushValues.includes(11) && flushValues.includes(12)) {
          return 'Royal Flush';
        }
        return 'Straight Flush';
      }
    }

    const countValues = Object.values(counts);
    if (countValues.includes(4)) return 'Four of a Kind';
    if (countValues.includes(3) && countValues.includes(2)) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (countValues.includes(3)) return 'Three of a Kind';
    if (countValues.filter(v => v === 2).length >= 2) return 'Two Pair';
    if (countValues.includes(2)) return 'One Pair';

    return 'High Card';
  }

  private checkStraight(values: number[]): boolean {
    const set = new Set(values);
    const unique = Array.from(set).sort((a, b) => a - b);

    if (set.has(12) && set.has(0) && set.has(1) && set.has(2) && set.has(3)) {
      return true;
    }

    for (let i = 0; i <= unique.length - 5; i++) {
      if (
        unique[i + 4] - unique[i] === 4 &&
        new Set(unique.slice(i, i + 5)).size === 5
      ) {
        return true;
      }
    }
    return false;
  }

  private getHandRank(name: string): number {
    const ranks = [
      'High Card',
      'One Pair',
      'Two Pair',
      'Three of a Kind',
      'Straight',
      'Flush',
      'Full House',
      'Four of a Kind',
      'Straight Flush',
      'Royal Flush',
    ];
    return ranks.indexOf(name);
  }

  clearLastResult(): void {
    this.lastResult = null;
  }
}