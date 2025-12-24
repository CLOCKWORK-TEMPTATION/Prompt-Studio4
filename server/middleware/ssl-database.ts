import { PoolConfig } from "pg";

/**
 * SSL Database Connection Configuration
 * Ensures secure database connections in production environments
 */

/**
 * Get SSL configuration for database connections
 */
export function getSSLConfig(): boolean | { rejectUnauthorized: boolean } {
    // In production, always require SSL
    if (process.env.NODE_ENV === "production") {
        return {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false"
        };
    }

    // In development, allow self-signed certificates for local development
    return {
        rejectUnauthorized: false
    };
}

/**
 * Get database connection configuration with SSL
 */
export function getDatabaseConfig(): PoolConfig {
    const config: PoolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: getSSLConfig(),
        max: 20, // Maximum number of clients in the pool
        min: 2,  // Minimum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    };

    // Additional security settings for production
    if (process.env.NODE_ENV === "production") {
        config.statement_timeout = 30000; // 30 second timeout for queries
        config.query_timeout = 30000; // 30 second timeout for queries
    }

    return config;
}

/**
 * Validate database URL format and SSL requirements
 */
export function validateDatabaseConfig(): void {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is required");
    }

    // Check if URL uses SSL in production
    if (process.env.NODE_ENV === "production") {
        if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
            throw new Error("DATABASE_URL must use postgresql:// or postgres:// protocol");
        }

        // Warn if not using SSL in production
        if (!databaseUrl.includes("sslmode=require") && !databaseUrl.includes("ssl=true")) {
            console.warn("⚠️  WARNING: Database connection in production should use SSL. Consider adding sslmode=require to DATABASE_URL");
        }
    }
}

/**
 * Database connection health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
    try {
        const { Pool } = await import("pg");
        const pool = new Pool(getDatabaseConfig());

        const client = await pool.connect();
        const result = await client.query("SELECT NOW()");
        client.release();
        await pool.end();

        console.log("✅ Database connection healthy:", result.rows[0].now);
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error instanceof Error ? error.message : "Unknown error");
        return false;
    }
}

/**
 * Secure database middleware for Express
 */
export function secureDatabaseMiddleware() {
    return (req: any, res: any, next: any) => {
        // Add database connection info to request for debugging
        if (process.env.NODE_ENV !== "production") {
            req.dbConfig = {
                ssl: getSSLConfig(),
                hasSsl: process.env.DATABASE_URL?.includes("sslmode=require") || process.env.DATABASE_URL?.includes("ssl=true")
            };
        }
        next();
    };
}

// Export configuration
export const sslDatabaseConfig = {
    getSSLConfig,
    getDatabaseConfig,
    validateDatabaseConfig,
    checkDatabaseHealth,
    secureDatabaseMiddleware
};