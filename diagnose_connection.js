const sql = require('mssql');

const configs = [
    // Try with different connection options
    {
        name: 'TCP/IP with port',
        config: {
            user: 'uh_admin',
            password: 'uh_admin',
            server: 'DESKTOP-DI29PVA,1433',
            database: 'UnionHall',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        }
    },
    {
        name: 'Named Pipes',
        config: {
            user: 'uh_admin',
            password: 'uh_admin',
            server: 'DESKTOP-DI29PVA\\MSSQLSERVER01',
            database: 'UnionHall',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }
    },
    {
        name: 'Localhost with instance',
        config: {
            user: 'uh_admin',
            password: 'uh_admin',
            server: 'localhost\\MSSQLSERVER01',
            database: 'UnionHall',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        }
    }
];

async function testConfig(name, config) {
    try {
        console.log(`\nTesting: ${name}`);
        console.log(`Server: ${config.server}`);
        
        const pool = await sql.connect(config);
        console.log('✓ Connected successfully!');
        
        await pool.close();
        return true;
    } catch (err) {
        console.log('✗ Failed:', err.message);
        return false;
    }
}

async function diagnose() {
    console.log('SQL Server Connection Diagnostics');
    console.log('=================================');
    
    for (const {name, config} of configs) {
        const success = await testConfig(name, config);
        if (success) {
            console.log('\n✓ Found working configuration!');
            break;
        }
    }
}

diagnose();