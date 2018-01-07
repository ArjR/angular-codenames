import { User } from './user';

export class Message {
    constructor(
        public timestamp: Date,
        //public from: User,
        public content: string
    ) { }
}