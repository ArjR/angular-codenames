export class User {
    constructor(
        public userName: string,
        public connected: boolean,
        public socketId: string
    ) { }
}