<#
.SYNOPSIS
    Seeds AWS SSM Parameter Store (SecureString) for /car-service/prod/* and /car-service/staging/*.

.DESCRIPTION
    Replace the placeholder values below with your actual secrets before running,
    or pass -DryRun to preview the SSM parameter paths without writing to AWS.

.EXAMPLE
    .\seed-ssm.ps1 -DryRun
    .\seed-ssm.ps1 -Environment prod -Region ap-southeast-1
    .\seed-ssm.ps1 -Environment all -Region ap-southeast-1
#>

[CmdletBinding()]
param(
    [ValidateSet("prod", "staging", "all")]
    [string]$Environment = "all",

    [string]$Region = "ap-southeast-1",

    [string]$DomainName = "carservice.id.vn",

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Set-SsmEnvParams {
    param(
        [string]$EnvName,
        [hashtable]$Params
    )

    $prefix = "/car-service/$EnvName"
    Write-Host "==> Seeding SSM parameters under $prefix ($Region)..." -ForegroundColor Cyan

    foreach ($key in ($Params.Keys | Sort-Object)) {
        $name = "$prefix/$key"
        $value = $Params[$key]

        if ($DryRun) {
            Write-Host "  [DRY-RUN] aws ssm put-parameter --name $name --type SecureString --overwrite --region $Region"
            continue
        }

        aws ssm put-parameter `
            --name $name `
            --value $value `
            --type SecureString `
            --overwrite `
            --region $Region | Out-Null

        if ($LASTEXITCODE -ne 0) {
            throw "Failed to put SSM parameter: $name"
        }
        Write-Host "  [OK] $name" -ForegroundColor Green
    }
}

$prodParams = @{
    APP_VERSION           = "1.0.0"
    LOG_LEVEL             = "info"
    FRONTEND_URL          = "https://$DomainName"
    INTERNAL_FRONTEND_URL = "https://ops.$DomainName"
    CORS_ORIGINS          = "https://$DomainName,https://ops.$DomainName"
    DATABASE_URL          = "mysql://USER:PASSWORD@RDS_ENDPOINT:3306/car_service_prod"
    JWT_SECRET            = "REPLACE_WITH_PROD_JWT_SECRET_MIN_32_CHARS"
    JWT_EXPIRES_IN        = "7d"
    GMAIL_USER            = "REPLACE_WITH_GMAIL_USER"
    GMAIL_APP_PASSWORD    = "REPLACE_WITH_GMAIL_APP_PASSWORD"
    CLOUDINARY_NAME       = "REPLACE_WITH_CLOUDINARY_NAME"
    CLOUDINARY_API_KEY    = "REPLACE_WITH_CLOUDINARY_API_KEY"
    CLOUDINARY_API_SECRET = "REPLACE_WITH_CLOUDINARY_API_SECRET"
    GEMINI_API_KEY_1      = "REPLACE_WITH_GEMINI_KEY_1"
    GEMINI_API_KEY_2      = "REPLACE_WITH_GEMINI_KEY_2"
    GEMINI_API_KEYS       = "REPLACE_WITH_GEMINI_KEY_1,REPLACE_WITH_GEMINI_KEY_2"
    GEMINI_MODEL          = "gemini-2.5-flash"
    AWS_REGION            = $Region
    STORAGE_PROVIDER      = "cloudinary"
    AWS_S3_BUCKET         = "car-service-center-assets"
    EMAIL_PROVIDER        = "smtp"
    SES_FROM_EMAIL        = "no-reply@$DomainName"
}

$stagingParams = @{
    APP_VERSION           = "1.0.0-staging"
    LOG_LEVEL             = "debug"
    FRONTEND_URL          = "https://staging.$DomainName"
    INTERNAL_FRONTEND_URL = "https://staging-ops.$DomainName"
    CORS_ORIGINS          = "https://staging.$DomainName,https://staging-ops.$DomainName"
    DATABASE_URL          = "mysql://USER:PASSWORD@RDS_ENDPOINT:3306/car_service_staging"
    JWT_SECRET            = "REPLACE_WITH_STAGING_JWT_SECRET_MIN_32_CHARS"
    JWT_EXPIRES_IN        = "7d"
    GMAIL_USER            = "REPLACE_WITH_GMAIL_USER"
    GMAIL_APP_PASSWORD    = "REPLACE_WITH_GMAIL_APP_PASSWORD"
    CLOUDINARY_NAME       = "REPLACE_WITH_CLOUDINARY_NAME"
    CLOUDINARY_API_KEY    = "REPLACE_WITH_CLOUDINARY_API_KEY"
    CLOUDINARY_API_SECRET = "REPLACE_WITH_CLOUDINARY_API_SECRET"
    GEMINI_API_KEY_1      = "REPLACE_WITH_GEMINI_KEY_1"
    GEMINI_API_KEY_2      = "REPLACE_WITH_GEMINI_KEY_2"
    GEMINI_API_KEYS       = "REPLACE_WITH_GEMINI_KEY_1,REPLACE_WITH_GEMINI_KEY_2"
    GEMINI_MODEL          = "gemini-2.5-flash"
    AWS_REGION            = $Region
    STORAGE_PROVIDER      = "cloudinary"
    AWS_S3_BUCKET         = "car-service-center-assets-staging"
    EMAIL_PROVIDER        = "smtp"
    SES_FROM_EMAIL        = "no-reply@$DomainName"
}

if ($Environment -in @("prod", "all")) {
    Set-SsmEnvParams -EnvName "prod" -Params $prodParams
}

if ($Environment -in @("staging", "all")) {
    Set-SsmEnvParams -EnvName "staging" -Params $stagingParams
}

Write-Host "==> Done." -ForegroundColor Cyan
