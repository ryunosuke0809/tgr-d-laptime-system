
console.log('START HISTORY CONTROLLER');

const HistoryModel = require('../models/HistoryModel');

module.exports = {
    /**
     * Render history page
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    init: async function (req, res) {
        try {
            const { raceid, sessionid } = req.params;
            
            // Get session list for the specified race
            let sessions = [];
            try {
                sessions = await HistoryModel.getSessionList(raceid);
            } catch (err) {
                console.warn(`No data found for raceid: ${raceid}. Rendering empty page.`);
                // Continue with empty sessions array
            }
            
            // Convert sessionid from string (e.g., "008") to integer (e.g., 8)
            let targetSessionId = sessionid ? parseInt(sessionid, 10) : null;
            
            // Find last session if not specified
            if (!targetSessionId && sessions.length > 0) {
                targetSessionId = sessions[sessions.length - 1].sessionid;
            }
            
            res.render('../views/history.ejs', {
                raceid: raceid,
                sessionid: targetSessionId,
                sessions: sessions,
                id: req.session.userid || '',
                sid: req.session.sid || ''
            });
        } catch (err) {
            console.error('History init error:', err);
            res.status(500).send(`
                <!DOCTYPE html>
                <html><head><title>Error</title></head>
                <body style="background:#000;color:#fff;padding:20px;font-family:sans-serif;">
                    <h1>Error</h1>
                    <p>${err.message}</p>
                </body></html>
            `);
        }
    },

    /**
     * Get result data API endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    getResult: async function (req, res) {
        try {
            const raceid = req.query.raceid || req.body.raceid;
            let sessionid = req.query.sessionid || req.body.sessionid;

            if (!raceid || !sessionid) {
                return res.status(400).json({ error: 'raceid and sessionid are required' });
            }

            // Convert sessionid to integer
            sessionid = parseInt(sessionid, 10);

            const result = await HistoryModel.getResult(raceid, sessionid);
            res.json(result);
        } catch (err) {
            console.error('Get result error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * Get personal lap data API endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    getPersonal: async function (req, res) {
        try {
            const raceid = req.query.raceid || req.body.raceid;
            let sessionid = req.query.sessionid || req.body.sessionid;
            const carno = req.query.carno || req.body.carno;

            if (!raceid || !sessionid || !carno) {
                return res.status(400).json({ error: 'raceid, sessionid, and carno are required' });
            }

            // Convert sessionid to integer
            sessionid = parseInt(sessionid, 10);

            const personal = await HistoryModel.getPersonal(raceid, sessionid, carno);
            res.json(personal);
        } catch (err) {
            console.error('Get personal error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    /**
     * Get available sessions for a race
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    getSessionList: async function (req, res) {
        try {
            const raceid = req.query.raceid || req.params.raceid;

            if (!raceid) {
                return res.status(400).json({ error: 'raceid is required' });
            }

            const sessions = await HistoryModel.getSessionList(raceid);
            res.json({ sessions });
        } catch (err) {
            console.error('Get session list error:', err);
            res.status(500).json({ error: err.message });
        }
    }
};
