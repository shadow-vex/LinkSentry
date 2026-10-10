
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { analyzeUrl } from "./urlAnalyzer.js";
import { z } from "zod";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const urlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(2048, "URL is too long")
  .url("Please provide a valid URL");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);

app.use(express.json({ limit: "10kb" }));

// Health check
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "LinkSentry API is running",
  });
});

// Database check
app.get("/api/v1/db-check", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");

    res.status(200).json({
      status: "success",
      message: "Database connection successful",
      server_time: result.rows[0].server_time,
    });
  } catch (error) {
    console.error(
      "Database check error:",
      error instanceof Error ? error.message : error
    );

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

// URL validation and phishing risk analysis

app.post("/api/v1/url-check", async (req, res) => {
  const parsed = urlSchema.safeParse(req.body?.url);

  if (!parsed.success) {
    return res.status(400).json({
      status: "error",
      message: "Please provide a valid URL",
    });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(parsed.data);
  } catch {
    return res.status(400).json({
      status: "error",
      message: "Invalid URL",
    });
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username !== "" ||
    parsedUrl.password !== ""
  ) {
    return res.status(400).json({
      status: "error",
      message:
        "Only HTTP/HTTPS URLs without embedded credentials are accepted",
    });
  }

  const submittedUrl = parsed.data;

  try {
    // Analyze URL text only. Do not fetch the submitted URL.
    const analysis = analyzeUrl(parsedUrl.href);

    const result = await pool.query(
      `INSERT INTO url_scans
        (
          submitted_url,
          normalized_url,
          risk_status,
          source,
          risk_score,
          detection_reasons
        )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING
         id,
         submitted_url,
         normalized_url,
         risk_status,
         source,
         risk_score,
         detection_reasons,
         created_at`,
      [
        submittedUrl,
        analysis.normalized_url,
        analysis.risk_status,
        "user",
        analysis.risk_score,
        JSON.stringify(analysis.reasons),
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "URL analysis completed",
      scan: result.rows[0],
      analysis: {
        risk_score: analysis.risk_score,
        risk_status: analysis.risk_status,
        reasons: analysis.reasons,
      },
    });
  } catch (error) {
    console.error(
      "URL analysis error:",
      error instanceof Error ? error.message : error
    );

    return res.status(500).json({
      status: "error",
      message: "Could not analyze and save URL",
    });
  }
});

// URL scan history
app.get("/api/v1/url-history", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         submitted_url,
         normalized_url,
         risk_status,
         source,
         risk_score,
         detection_reasons,
         created_at
       FROM url_scans
       ORDER BY created_at DESC
       LIMIT 50`
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      scans: result.rows,
    });
  } catch (error) {
    console.error(
      "URL history error:",
      error instanceof Error ? error.message : error
    );

    return res.status(500).json({
      status: "error",
      message: "Could not retrieve URL history",
    });
  }
});


// URL scan history
app.get("/api/v1/url-history", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, submitted_url, normalized_url,
              risk_status, source, created_at
       FROM url_scans
       ORDER BY created_at DESC
       LIMIT 50`
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      scans: result.rows,
    });
  } catch (error) {
    console.error(
      "URL history error:",
      error instanceof Error ? error.message : error
    );

    return res.status(500).json({
      status: "error",
      message: "Could not retrieve URL history",
    });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found",
  });
});

// General error handler
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("API error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`LinkSentry API running at http://localhost:${PORT}`);
});
