import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const TARGET_EXE = "Sole What Setup 1.5.9.exe";

/**
 * API Route: /api/download-pos
 * Directly streams the FloDesktop POS installer executable (Sole What Setup 1.5.9.exe)
 * to the client's browser with auto-download headers and range support.
 */
export async function GET(request: NextRequest) {
  const candidatePaths = [
    path.join(process.cwd(), "public", "release", TARGET_EXE),
    path.join(process.cwd(), "release", TARGET_EXE),
    path.join("C:\\Users\\azwaj\\OneDrive\\Desktop\\FloDesktop\\release", TARGET_EXE),
    path.join("C:\\Users\\azwaj\\FloDesktopRelease", TARGET_EXE),
  ];

  let targetPath = candidatePaths.find((p) => fs.existsSync(p));

  // If exact 1.5.9 not found, search in release directories
  if (!targetPath) {
    const searchDirs = [
      path.join(process.cwd(), "public", "release"),
      path.join(process.cwd(), "release"),
      "C:\\Users\\azwaj\\OneDrive\\Desktop\\FloDesktop\\release",
      "C:\\Users\\azwaj\\FloDesktopRelease",
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const exeFiles = files
          .filter((f) => f.toLowerCase().endsWith(".exe"))
          .sort()
          .reverse();

        if (exeFiles.length > 0) {
          targetPath = path.join(dir, exeFiles[0]);
          break;
        }
      }
    }
  }

  if (!targetPath || !fs.existsSync(targetPath)) {
    return NextResponse.json(
      {
        error: "FloDesktop POS Setup file not found in release directory.",
        candidatePaths,
      },
      { status: 404 }
    );
  }

  const stat = fs.statSync(targetPath);
  const fileSize = stat.size;
  const fileName = path.basename(targetPath);

  // Support HTTP range requests for resuming large downloads (1.1+ GB)
  const range = request.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fileStream = fs.createReadStream(targetPath, { start, end });

    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new Response(stream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "application/vnd.microsoft.portable-executable",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  }

  // Full file stream
  const fileStream = fs.createReadStream(targetPath);

  const stream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      fileStream.destroy();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.microsoft.portable-executable",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": fileSize.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
