
#!/bin/bash

# This script must be sourced to set environment variables in the current shell
# Usage: source setAWSEnvironment.sh <profile>
# or:    . setAWSEnvironment.sh <profile>

# Check if profile argument was provided
if [ -z "$1" ]; then
    echo "Please provide a profile name as argument"
    return 1 2>/dev/null || exit 1
fi

profile=$1

# Switch statement to set AWS profile and region based on input
case $profile in
    "local")
        export CMP_DB_SERVER="DESKTOP-DI29PVA\\MSSQLSERVER01"
        export CMP_DB_DATABASE="UnionHall"
        export CMP_DB_USER="uh_admin"
        export CMP_DB_PASSWORD="uh_admin"
        export CMP_DB_TRUST_CERT="true"
        export CMP_DB_ENCRYPT="true"
        ;;
    *)
        echo "Invalid profile. Valid options are: vtinfra, townica, vt-sandbox"
        return 1 2>/dev/null || exit 1
        ;;
esac

echo "DB Server set to: $CMP_DB_SERVER"
echo "DB Database set to: $CMP_DB_DATABASE"
