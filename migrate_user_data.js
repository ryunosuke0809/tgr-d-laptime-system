const fs = require('fs');

// ユーザーデータを読み込み
const userData = JSON.parse(fs.readFileSync('data/user.json', 'utf8'));

// 既存データを新形式に変換
const migratedData = userData.map(user => {
    // expiryDateがある場合、expiryStartDateとexpiryEndDateに変換
    // expiryDateを終了日として、開始日は設定しない
    return {
        id: user.id,
        password: user.password,
        name: user.name,
        company: user.company || null,
        role: user.role,
        expiryStartDate: null,  // 既存ユーザーは開始日なし
        expiryEndDate: user.expiryDate || null  // 既存のexpiryDateを終了日に
    };
});

// 新しい形式で保存
fs.writeFileSync('data/user.json', JSON.stringify(migratedData, null, 4), 'utf8');

console.log(`Migrated ${migratedData.length} users to new format`);
console.log('Sample user:', JSON.stringify(migratedData[0], null, 2));
