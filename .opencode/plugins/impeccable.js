import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HOOK_REL = [".agents", "skills", "impeccable", "scripts", "hook.mjs"];

const seenSessions = [];

function resolveFilePath(args, cwd) {
  if (!args || typeof args !== "object") return null;
  const first =
    args.filePath || args.path || args.absolutePath || args.file_path || null;
  if (typeof first !== "string" || !first) return null;
  return path.isAbsolute(first) ? first : path.resolve(cwd, first);
}

function parseEnvelope(stdout) {
  const raw = (stdout || "").toString().trim();
  if (!raw) return "";
  try {
    const json = JSON.parse(raw);
    return (
      json?.hookSpecificOutput?.additionalContext ||
      json?.additionalContext ||
      ""
    );
  } catch {
    return raw;
  }
}

export const ImpeccablePlugin = async ({ client, directory }) => {
  const hookEntry = path.join(directory, ...HOOK_REL);
  const available = fs.existsSync(hookEntry);

  const runHook = (event) => {
    if (!available) return "";
    const res = spawnSync(process.execPath, [hookEntry], {
      input: JSON.stringify(event),
      cwd: directory,
      encoding: "utf8",
      windowsHide: true,
    });
    return (res.stdout || "").toString();
  };

  return {
    "tool.execute.after": async (input, output) => {
      const filePath = resolveFilePath(input.args, directory);
      if (!filePath) return;
      if (!seenSessions.includes(input.sessionID)) {
        seenSessions.push(input.sessionID);
      }

      const event = {
        hook_event_name: "PostToolUse",
        session_id: input.sessionID,
        cwd: directory,
        tool_name: String(input.tool || "").toLowerCase(),
        tool_input: { ...(input.args || {}), file_path: filePath },
      };

      const context = parseEnvelope(runHook(event));
      if (context && output) {
        output.output = `${output.output || ""}\n\n${context}`.trim();
      }
    },
    event: async ({ event }) => {
      if (event?.type !== "session.idle") return;
      const sessionID =
        event?.sessionID ||
        event?.properties?.sessionID ||
        seenSessions[seenSessions.length - 1];
      if (!sessionID) return;

      const context = parseEnvelope(
        runHook({
          hook_event_name: "Stop",
          session_id: sessionID,
          cwd: directory,
        }),
      );
      if (!context) return;
      try {
        // best-effort: surface remaining findings so the next turn can see them
        await client?.app?.log?.({
          body: {
            service: "impeccable",
            level: "info",
            message: context,
          },
        });
      } catch {
        /* ignore */
      }
    },
  };
};