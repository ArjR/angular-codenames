import { User } from './user';

export class Message {
    constructor(
        public timestamp: number,
        //public from: User,
        public content: string
    ) { }
}