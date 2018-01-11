import * as fs from 'fs';
import * as path from "path";
import * as _ from "lodash";

export class RandomWordService {

    private officialWords: string[] = [];
    private officialWordsFileLocation: string = '../data/official.txt';

    constructor() {
        this.initialiseWords();
    }

    private initialiseWords() {
        fs.readFile(path.join(__dirname, this.officialWordsFileLocation), 'utf8', (error, data) => {
            let words = data.split('\n');
            _.forEach(words, word => {
                this.officialWords.push(word);
            });
        });
    }

    public getAllOfficialWords() : string[]{
        return this.officialWords;
    }

    public getRandomOfficialWord(): string {
        return _.sample(this.officialWords);
    }
}