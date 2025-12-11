
console.log('START HISTORY MODEL');

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const HISTORY_DB_DIR = path.join(__dirname, '../data/history');

module.exports = {
    /**
     * Get list of available race databases
     */
    getRaceList: function () {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(HISTORY_DB_DIR)) {
                    fs.mkdirSync(HISTORY_DB_DIR, { recursive: true });
                }
                
                const files = fs.readdirSync(HISTORY_DB_DIR);
                const raceList = files
                    .filter(file => file.endsWith('.db'))
                    .map(file => ({
                        raceid: file.replace('.db', ''),
                        filename: file
                    }));
                
                resolve(raceList);
            } catch (err) {
                reject(err);
            }
        });
    },

    /**
     * Get session list for a specific race
     */
    getSessionList: function (raceid) {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(HISTORY_DB_DIR, `${raceid}.db`);
            
            if (!fs.existsSync(dbPath)) {
                console.warn(`Database not found: ${raceid}.db`);
                return resolve([]); // Return empty array instead of error
            }

            try {
                const db = new Database(dbPath, { readonly: true });
                const sessions = db.prepare(`
                    SELECT 
                        raceid,
                        sessionid,
                        sessionname,
                        sessiontype,
                        fromtime,
                        totime,
                        fastest_no,
                        fastest_driver,
                        fastest_time,
                        fastest_lap
                    FROM sessioninfo
                    ORDER BY sessionid
                `).all();
                
                db.close();
                resolve(sessions || []);
            } catch (err) {
                console.error(`Error reading ${raceid}.db:`, err);
                resolve([]); // Return empty array on error
            }
        });
    },

    /**
     * Get result data for a specific session
     */
    getResult: function (raceid, sessionid) {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(HISTORY_DB_DIR, `${raceid}.db`);
            
            if (!fs.existsSync(dbPath)) {
                console.warn(`Database not found: ${raceid}.db`);
                return resolve({ mode: '0', descr: 'No Data', rows: [] });
            }

            try {
                const db = new Database(dbPath, { readonly: true });
                
                // Get session info
                const sessionInfo = db.prepare(`
                    SELECT * FROM sessioninfo
                    WHERE raceid = ? AND sessionid = ?
                `).get(raceid, sessionid);

                if (!sessionInfo) {
                    db.close();
                    console.warn(`Session not found: ${raceid}/${sessionid}`);
                    return resolve({ mode: '0', descr: 'No Data', rows: [] });
                }

                // Get result data
                const results = db.prepare(`
                    SELECT 
                        pos,
                        carno,
                        driver,
                        team,
                        laps,
                        gap,
                        diff,
                        besttime,
                        bestlap,
                        totaltime,
                        ave,
                        pit
                    FROM result
                    WHERE raceid = ? AND sessionid = ?
                    ORDER BY pos
                `).all(raceid, sessionid);
                
                db.close();
                
                resolve({
                    mode: sessionInfo.sessiontype || '0',
                    descr: sessionInfo.sessionname || '',
                    rows: results.map(row => ({
                        cell: [
                            row.pos,           // 0: Pos
                            row.carno,         // 1: No
                            row.driver,        // 2: Driver
                            row.team,          // 3: Team
                            row.besttime,      // 4: BestTime
                            row.bestlap,       // 5: inLap
                            row.gap,           // 6: Gap
                            row.diff,          // 7: Diff
                            row.laps,          // 8: Laps
                            row.totaltime,     // 9: TotalTime
                            sessionid,         // 10: sessionid (for personal query)
                            row.carno          // 11: carno (for personal query)
                        ]
                    }))
                });
            } catch (err) {
                console.error(`Error reading result from ${raceid}.db:`, err);
                resolve({ mode: '0', descr: 'Error', rows: [] });
            }
        });
    },

    /**
     * Get personal lap data for a specific car
     */
    getPersonal: function (raceid, sessionid, carno) {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(HISTORY_DB_DIR, `${raceid}.db`);
            
            if (!fs.existsSync(dbPath)) {
                console.warn(`Database not found: ${raceid}.db`);
                return resolve({ rows: [] });
            }

            try {
                const db = new Database(dbPath, { readonly: true });
                
                const laps = db.prepare(`
                    SELECT 
                        laps,
                        laptime,
                        sec1time,
                        sec2time,
                        sec3time,
                        sec4time,
                        speed,
                        tire,
                        pit,
                        driver
                    FROM personal
                    WHERE raceid = ? AND sessionid = ? AND carno = ?
                    ORDER BY laps
                `).all(raceid, sessionid, carno);
                
                db.close();
                
                resolve({
                    rows: laps.map(lap => ({
                        cell: [
                            '',                // 0: (empty)
                            lap.laps,          // 1: Lap
                            lap.laptime,       // 2: LapTime
                            lap.sec1time,      // 3: Sec1
                            lap.sec2time,      // 4: Sec2
                            lap.sec3time,      // 5: Sec3
                            '',                // 6: (empty)
                            '',                // 7: (empty)
                            lap.speed,         // 8: Speed
                            '',                // 9: (empty)
                            '',                // 10: (empty)
                            lap.pit,           // 11: Pit
                            lap.driver         // 12: Driver
                        ]
                    }))
                });
            } catch (err) {
                console.error(`Error reading personal data from ${raceid}.db:`, err);
                resolve({ rows: [] });
            }
        });
    }
};
