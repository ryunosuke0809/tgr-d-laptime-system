const fs = require('fs');
const path = require('path');

const USER_FILE = path.join(__dirname, '../data/user.json');

console.log('START USER  MODULE');

// ユーザーデータを読み込む
function readUsers() {
    return new Promise((resolve, reject) => {
        fs.readFile(USER_FILE, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

// ユーザーデータを保存する
function writeUsers(users) {
    return new Promise((resolve, reject) => {
        fs.writeFile(USER_FILE, JSON.stringify(users, null, 4), 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

module.exports = {
    // 全ユーザーを取得
    getAllUsers: async function() {
        try {
            const users = await readUsers();
            // パスワードを除外して返す
            return users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }));
        } catch (err) {
            throw err;
        }
    },

    // 特定のユーザーを取得
    getUserById: async function(userId) {
        try {
            const users = await readUsers();
            const user = users.find(u => u.id === userId);
            if (user) {
                // パスワードを除外して返す
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            }
            return null;
        } catch (err) {
            throw err;
        }
    },

    // ユーザーを作成
    createUser: async function(userData) {
        try {
            const users = await readUsers();
            
            // IDの重複チェック
            if (users.find(u => u.id === userData.id)) {
                throw new Error('User ID already exists');
            }
            
            // 新しいユーザーを追加
            users.push({
                id: userData.id,
                password: userData.password,
                name: userData.name,
                email: userData.email,
                role: userData.role || 'user'
            });
            
            await writeUsers(users);
            return { success: true, message: 'User created successfully' };
        } catch (err) {
            throw err;
        }
    },

    // ユーザーを更新
    updateUser: async function(userId, userData) {
        try {
            const users = await readUsers();
            const index = users.findIndex(u => u.id === userId);
            
            if (index === -1) {
                throw new Error('User not found');
            }
            
            // ユーザー情報を更新（IDは変更不可）
            users[index] = {
                id: userId,
                password: userData.password || users[index].password,
                name: userData.name || users[index].name,
                email: userData.email || users[index].email,
                role: userData.role || users[index].role
            };
            
            await writeUsers(users);
            return { success: true, message: 'User updated successfully' };
        } catch (err) {
            throw err;
        }
    },

    // ユーザーを削除
    deleteUser: async function(userId) {
        try {
            const users = await readUsers();
            const filteredUsers = users.filter(u => u.id !== userId);
            
            if (users.length === filteredUsers.length) {
                throw new Error('User not found');
            }
            
            await writeUsers(filteredUsers);
            return { success: true, message: 'User deleted successfully' };
        } catch (err) {
            throw err;
        }
    },

    // パスワードを変更
    changePassword: async function(userId, oldPassword, newPassword) {
        try {
            const users = await readUsers();
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            if (user.password !== oldPassword) {
                throw new Error('Old password is incorrect');
            }
            
            user.password = newPassword;
            await writeUsers(users);
            return { success: true, message: 'Password changed successfully' };
        } catch (err) {
            throw err;
        }
    }
}