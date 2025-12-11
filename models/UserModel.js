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

// 有効期限チェック（期間対応）
function isAccountExpired(expiryStartDate, expiryEndDate) {
    // 開始日と終了日が両方nullの場合は無期限
    if (!expiryStartDate && !expiryEndDate) {
        return false;
    }
    
    const now = new Date();
    
    // 開始日チェック
    if (expiryStartDate) {
        const startDate = new Date(expiryStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (now < startDate) {
            return true; // まだ有効期間開始前
        }
    }
    
    // 終了日チェック
    if (expiryEndDate) {
        const endDate = new Date(expiryEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (now > endDate) {
            return true; // 有効期間終了後
        }
    }
    
    return false; // 有効期間内
}

// 有効期限の状態を取得
function getExpiryStatus(expiryStartDate, expiryEndDate) {
    if (!expiryStartDate && !expiryEndDate) {
        return 'unlimited'; // 無期限
    }
    if (isAccountExpired(expiryStartDate, expiryEndDate)) {
        return 'expired'; // 期限切れ
    }
    return 'valid'; // 有効
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
                company: user.company || null,
                role: user.role,
                expiryStartDate: user.expiryStartDate || null,
                expiryEndDate: user.expiryEndDate || null,
                expiryStatus: getExpiryStatus(user.expiryStartDate, user.expiryEndDate)
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
                    company: user.company || null,
                    role: user.role,
                    expiryStartDate: user.expiryStartDate || null,
                    expiryEndDate: user.expiryEndDate || null,
                    expiryStatus: getExpiryStatus(user.expiryStartDate, user.expiryEndDate)
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
            
            // IDの重複チェック（大文字小文字を区別しない）
            const existingUser = users.find(u => u.id.toLowerCase() === userData.id.toLowerCase());
            if (existingUser) {
                console.error('[UserModel] Duplicate user ID detected:', userData.id);
                throw new Error('User ID already exists');
            }
            
            // 新しいユーザーを追加
            const newUser = {
                id: userData.id,
                password: userData.password,
                name: userData.name,
                company: userData.company || null,
                role: userData.role || 'user',
                expiryStartDate: userData.expiryStartDate || null,
                expiryEndDate: userData.expiryEndDate || null
            };
            
            users.push(newUser);
            console.log('[UserModel] Creating new user:', newUser.id);
            
            await writeUsers(users);
            return { success: true, message: 'User created successfully' };
        } catch (err) {
            console.error('[UserModel] Error in createUser:', err.message);
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
            // 有効期限は明示的にnullが渡された場合はnullに設定
            const expiryStartDate = userData.hasOwnProperty('expiryStartDate') 
                ? (userData.expiryStartDate || null) 
                : users[index].expiryStartDate;
            
            const expiryEndDate = userData.hasOwnProperty('expiryEndDate') 
                ? (userData.expiryEndDate || null) 
                : users[index].expiryEndDate;
            
            users[index] = {
                id: userId,
                password: userData.password || users[index].password,
                name: userData.name || users[index].name,
                company: userData.hasOwnProperty('company') ? userData.company : users[index].company,
                role: userData.role || users[index].role,
                expiryStartDate: expiryStartDate,
                expiryEndDate: expiryEndDate
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
    },

    // ユーザーのパスワードを取得（管理者用）
    getUserPassword: async function(userId) {
        try {
            const users = await readUsers();
            const user = users.find(u => u.id === userId);
            
            if (user) {
                return user.password;
            }
            return null;
        } catch (err) {
            throw err;
        }
    }
}