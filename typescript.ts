interface User {
    id: number;
    name: string;
    email?: string;
    isActive: boolean;
}

function createUser(id: number, name: string, email?: string, isActive: boolean = true): User {
    const user: User = { id, name, isActive };
    if (email !== undefined) {
        user.email = email;
    }
    return user;
}

const user1 = createUser(1, 'AliceInWonderland', 'alice@maul.com');
console.log(user1);

const user2 = createUser(2, 'SnailBob', undefined, false);

console.log(user2);

type Genre = 'fiction' | 'non-fiction';

interface Book {
    title: string;
    author: string;
    year?: number;
    genre: Genre;
}

function createBook(book: Book): Book {
    return book;
}

const book1: Book = {
    title: 'Metro 2033',
    author: 'Dmitry Glukhovskiy',
    year: 2005,
    genre: 'fiction'
};
console.log(createBook(book1));

const book2: Book = {
    title: 'FNaF Silver Eyes',
    author: 'Scott Cowton',
    genre: 'non-fiction'
};
console.log(createBook(book2));