import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import officialWords from '../data/official-words';
import snowWords from '../data/snow-words';
import { WordType } from '../model/game-classes';

export class RandomWordService {
    private officialWords: string[] = officialWords;
    private snowWords: string[] = snowWords;
    //private officialWordsFileLocation: string = '/../../server/data/official.txt';

    constructor() {
        this.initialiseWords();
    }

    private initialiseWords() {
        // fs.readFile(path.join(__dirname, this.officialWordsFileLocation), 'utf8', (error, data) => {
        //     let words = data.split('\n');
        //     _.forEach(words, word => {
        //         this.officialWords.push(word);
        //     });
        // });
    }

    public getAllOfficialWords(): string[] {
        return this.officialWords;
    }

    public getRandomOfficialWord(wordType: WordType): string {

        let words: string[] = null;

        switch (wordType) {
            case WordType.Official:
                words = this.officialWords;
                break;
            case WordType.Snow:
                words = this.snowWords;
                break;
            case null:
                words = this.officialWords;
                break;
        }

        return _.sample(words);
    }
}