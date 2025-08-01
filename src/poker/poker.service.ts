import { Injectable } from '@nestjs/common';
import { EvaluateHandDto } from './dto/evaluate-hand.dto';
import {Card} from "./card.interface";

@Injectable()
export class PokerService {
  private readonly rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  private lastResult: { combination: string; bestCards: Card[] } | null = null;

  evaluateAndSave(dto: EvaluateHandDto): { combination: string; bestCards: string[] } {
    const cards = dto.cards.map(c => ({
      rank: c.slice(0, -1) as Card['rank'],
      suit: c.slice(-1) as Card['suit'],
    }));

    const allFiveCardCombos = this.getCombinations(cards, 5);
    const best = allFiveCardCombos
      .map(combo => this.classifyHand(combo))
      .sort((a, b) => this.getHandRank(b.name) - this.getHandRank(a.name))[0];

    return {
      combination: best.name,
      bestCards: best.involved.map(c => c.rank + c.suit),
    };
  }

  private classifyHand(cards: Card[]): { name: string; involved: Card[] } {
    const suits: Record<string, Card[]> = {};
    const ranks: Record<string, Card[]> = {};

    for (const card of cards) {
      if (!suits[card.suit]) suits[card.suit] = [];
      suits[card.suit].push(card);

      if (!ranks[card.rank]) ranks[card.rank] = [];
      ranks[card.rank].push(card);
    }

    const flushCards = Object.values(suits).find(s => s.length >= 5);
    const hasFlush = !!flushCards;

    const getRankIndex = (card: Card) => this.rankOrder.indexOf(card.rank);
    const sortedByRank = [...cards].sort((a, b) => getRankIndex(b) - getRankIndex(a));
    const straight = this.getStraight(sortedByRank);

    if (hasFlush) {
      const flushSorted = [...flushCards].sort((a, b) => getRankIndex(b) - getRankIndex(a));
      const straightFlush = this.getStraight(flushSorted);
      if (straightFlush) {
        const isRoyal = straightFlush.every(c => ['10', 'J', 'Q', 'K', 'A'].includes(c.rank));
        return {
          name: isRoyal ? 'Royal Flush' : 'Straight Flush',
          involved: straightFlush,
        };
      }
    }

    const four = Object.values(ranks).find(g => g.length === 4);
    if (four) {
      const kickers = sortedByRank.filter(c => !four.includes(c)).slice(0, 1);
      return { name: 'Four of a Kind', involved: [...four, ...kickers] };
    }

    const threes = Object.values(ranks).filter(g => g.length === 3).sort((a, b) => getRankIndex(b[0]) - getRankIndex(a[0]));
    const pairs = Object.values(ranks).filter(g => g.length === 2).sort((a, b) => getRankIndex(b[0]) - getRankIndex(a[0]));

    if (threes.length >= 1 && (pairs.length >= 1 || threes.length >= 2)) {
      const three = threes[0];
      const pair = pairs[0] || threes[1].slice(0, 2);
      return { name: 'Full House', involved: [...three, ...pair] };
    }

    if (hasFlush) {
      const topFlush = [...flushCards]
        .sort((a, b) => getRankIndex(b) - getRankIndex(a))
        .slice(0, 5);
      return { name: 'Flush', involved: topFlush };
    }

    if (straight) {
      return { name: 'Straight', involved: straight };
    }

    if (threes.length >= 1) {
      const three = threes[0];
      const kickers = sortedByRank.filter(c => !three.includes(c)).slice(0, 2);
      return { name: 'Three of a Kind', involved: [...three, ...kickers] };
    }

    if (pairs.length >= 2) {
      const [p1, p2] = pairs;
      const kickers = sortedByRank.filter(c => !p1.includes(c) && !p2.includes(c)).slice(0, 1);
      return { name: 'Two Pair', involved: [...p1, ...p2, ...kickers] };
    }

    if (pairs.length >= 1) {
      const pair = pairs[0];
      const kickers = sortedByRank.filter(c => !pair.includes(c)).slice(0, 3);
      return { name: 'One Pair', involved: [...pair, ...kickers] };
    }

    return { name: 'High Card', involved: sortedByRank.slice(0, 5) };
  }

  private getStraight(cards: Card[]): Card[] | null {
    const seen: Record<string, Card> = {};
    for (const card of cards) {
      if (!seen[card.rank]) seen[card.rank] = card;
    }

    const uniqueRanks = Object.keys(seen);
    const indexes = uniqueRanks.map(r => this.rankOrder.indexOf(r)).sort((a, b) => b - a);

    for (let i = 0; i <= indexes.length - 5; i++) {
      const slice = indexes.slice(i, i + 5);
      const isSequential = slice.every((val, idx, arr) => idx === 0 || arr[idx - 1] - val === 1);
      if (isSequential) {
        return slice.map(index => seen[this.rankOrder[index]]);
      }
    }

    const lowStraight = ['A', '2', '3', '4', '5'];
    if (lowStraight.every(r => seen[r])) {
      return lowStraight.map(r => seen[r]);
    }

    return null;
  }

  private getHandRank(name: string): number {
    const ranking = [
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
    return ranking.indexOf(name);
  }

  private getCombinations<T>(arr: T[], k: number): T[][] {
    const result: T[][] = [];
    const combine = (start: number, combo: T[]) => {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    };
    combine(0, []);
    return result;
  }

  getLastResult(): { combination: string; bestCards: Card[] } | null {
    return this.lastResult;
  }

  clearLastResult(): void {
    this.lastResult = null;
  }
}
