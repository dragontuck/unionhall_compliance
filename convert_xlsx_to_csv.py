import pandas as pd
from pathlib import Path

# Directory containing the xlsx files
xlsx_dir = r'd:\Workspace\Github\unionhall_compliance\Data\skills'

# Get all xlsx files
xlsx_files = list(Path(xlsx_dir).glob('*.xlsx'))

if not xlsx_files:
    print("No .xlsx files found")
    exit(1)

print(f"Found {len(xlsx_files)} .xlsx files\n")

for xlsx_file in xlsx_files:
    try:
        csv_file = xlsx_file.with_suffix('.csv')
        
        # Read Excel file
        df = pd.read_excel(xlsx_file)
        
        # Write to CSV
        df.to_csv(csv_file, index=False)
        
        print(f"✓ {xlsx_file.name} -> {csv_file.name} ({len(df)} rows)")
        
    except Exception as e:
        print(f"✗ Error converting {xlsx_file.name}: {str(e)}")

print("\nConversion complete!")
