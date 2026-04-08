import pandas as pd
import pyodbc
from pathlib import Path

# SQL Server connection details
server = r'DESKTOP-DI29PVA\MSSQLSERVER01'
database = 'UnionHallUI'
connection_string = f'Driver={{ODBC Driver 17 for SQL Server}};Server={server};Database={database};Trusted_Connection=yes;'

# List of xlsx files to import
xlsx_files = [
    r'd:\Workspace\Github\unionhall_compliance\Data\skills\1_Journeyperson Candidates_OOWL_20260327.xlsx',
    r'd:\Workspace\Github\unionhall_compliance\Data\skills\2_Person_Certification_Ethnicity_20260317.xlsx',
    r'd:\Workspace\Github\unionhall_compliance\Data\skills\3_Person_Skill_Ethnicity_20260317.xlsx',
    r'd:\Workspace\Github\unionhall_compliance\Data\skills\5_People_Journeyperson_CurrentSusFor_20260327.xlsx',
]

try:
    # Create connection
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    print(f"✓ Connected to {server}/{database}")
    
    # Import each file
    for file_path in xlsx_files:
        if not Path(file_path).exists():
            print(f"✗ File not found: {file_path}")
            continue
        
        file_name = Path(file_path).stem
        print(f"\nImporting: {file_name}...")
        
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            
            # Sanitize table name (remove spaces, special characters)
            table_name = file_name.replace(' ', '_').replace('-', '_').replace('.', '_')
            
            # Write to SQL Server
            df.to_sql(table_name, conn, if_exists='replace', index=False)
            print(f"✓ Successfully imported to table: [{table_name}] ({len(df)} rows)")
            
        except Exception as e:
            print(f"✗ Error importing {file_name}: {str(e)}")
    
    conn.close()
    print("\n✓ Import process completed!")
    
except pyodbc.Error as e:
    print(f"✗ Connection error: {str(e)}")
    print("\nTroubleshooting:")
    print("1. Ensure SQL Server instance is running")
    print("2. Check server name: DESKTOP-DI29PVA\\MSSQLSERVER01")
    print("3. Verify database exists: UnionHallUI")
    print("4. Ensure ODBC Driver 17 for SQL Server is installed")
