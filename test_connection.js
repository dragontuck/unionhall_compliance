const sql = require('mssql');

const dbConfig = {
    user: 'uh_admin',
    password: 'uh_admin',
    server: 'DESKTOP-DI29PVA\\MSSQLSERVER01',
    database: 'UnionHall',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        console.log('Attempting to connect to SQL Server...');
        const pool = await sql.connect(dbConfig);
        console.log('✓ Connected successfully!');

        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('✓ Query executed successfully');
        console.log('Server version:', result.recordset[0].version);

        await pool.close();
        console.log('✓ Connection closed');
    } catch (err) {
        console.error('✗ Connection failed:', err.message);
    }
}

testConnection();