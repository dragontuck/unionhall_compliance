// Alternative version using Windows Authentication
const sql = require('mssql');

const dbConfig = {
    server: 'DESKTOP-DI29PVA\\MSSQLSERVER01',
    database: 'UnionHall',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true
    }
};

async function testConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('✓ Connected with Windows Authentication');
        await pool.close();
    } catch (err) {
        console.error('✗ Failed:', err.message);
    }
}

testConnection();