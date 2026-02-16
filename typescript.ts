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