const sql = require('mssql');

const config = {
    server: 'DESKTOP-DI29PVA\\MSSQLSERVER01',
    database: 'UnionHall',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true
    }
};

async function testWindowsAuth() {
    try {
        console.log('Testing Windows Authentication...');
        const pool = await sql.connect(config);
        console.log('✓ Connected with Windows Authentication!');
        
        const result = await pool.request().query('SELECT @@SERVERNAME as server, DB_NAME() as database');
        console.log('Server:', result.recordset[0].server);
        console.log('Database:', result.recordset[0].database);
        
        await pool.close();
    } catch (err) {
        console.error('✗ Windows Authentication failed:', err.message);
    }
}

testWindowsAuth();