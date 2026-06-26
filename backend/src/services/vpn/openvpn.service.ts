import { spawn, ChildProcess } from "child_process";
import { existsSync } from "fs";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/apiResponse";

type VpnState = "disconnected" | "connecting" | "connected";

class OpenVpnManager {
  private proc: ChildProcess | null = null;
  private state: VpnState = "disconnected";
  private connectPromise: Promise<void> | null = null;

  get isConnected(): boolean {
    return this.state === "connected";
  }

  /** Idempotent: connects on first call, reuses the live tunnel afterwards. */
  async ensureConnected(): Promise<void> {
    if (!env.vpn.enabled) return; // management disabled — assume the operator handled it
    if (this.state === "connected") return;
    if (this.connectPromise) return this.connectPromise; // a connect is already in flight

    this.connectPromise = this.connect().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  private connect(): Promise<void> {
    const { bin, config, auth, timeoutMs, verbose } = env.vpn;

    if (!existsSync(bin)) {
      return Promise.reject(
        new AppError(
          `OpenVPN binary not found at "${bin}". Set OPENVPN_BIN.`,
          500,
        ),
      );
    }
    if (!existsSync(config)) {
      return Promise.reject(
        new AppError(
          `OpenVPN config not found at "${config}". Set OPENVPN_CONFIG.`,
          500,
        ),
      );
    }

    this.state = "connecting";
    logger.info(`[vpn] connecting via ${config}`);

    const args = ["--config", config];
    if (auth && existsSync(auth)) args.push("--auth-user-pass", auth);

    return new Promise<void>((resolve, reject) => {
      const proc = spawn(bin, args, { windowsHide: true });
      this.proc = proc;

      const recentLogs: string[] = [];
      let settled = false;

      const finish = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) {
          this.state = "disconnected";
          if (recentLogs.length > 0) {
            const logDump = `\nRecent OpenVPN output:\n${recentLogs.map((l) => `  > ${l}`).join("\n")}`;
            if (err instanceof AppError) {
              err.message = `${err.message}${logDump}`;
            } else {
              err = new AppError(`${err.message}${logDump}`, 502);
            }
          }
          logger.error(`[vpn] VPN connection failed: ${err.message}`);
          reject(err);
        } else {
          this.state = "connected";
          logger.info("[vpn] VPN connected state established.");
          resolve();
        }
      };

      const timer = setTimeout(
        () =>
          finish(
            new AppError(
              "OpenVPN connection timed out. Make sure the backend runs as Administrator.",
              504,
            ),
          ),
        timeoutMs,
      );

      const handleLine = (raw: string) => {
        const line = raw.trim();
        if (!line) return;

        recentLogs.push(line);
        if (recentLogs.length > 20) {
          recentLogs.shift();
        }

        if (verbose) logger.info(`[openvpn] ${line}`);

        if (line.includes("Initialization Sequence Completed")) {
          logger.info("[vpn] connected.");
          finish();
        } else if (/AUTH_FAILED/i.test(line)) {
          finish(
            new AppError(
              "OpenVPN authentication failed (check credentials).",
              502,
            ),
          );
        } else if (/Access is denied|WFP: initialization failed/i.test(line)) {
          // Tunnel handshake succeeded but the adapter/firewall step needs elevation.
          finish(
            new AppError(
              "OpenVPN needs Administrator rights to configure the network adapter. " +
                "Start the backend from an elevated (Run as administrator) terminal, " +
                "or connect manually with the OpenVPN GUI and set VPN_ENABLED=false.",
              502,
            ),
          );
        } else if (
          /Cannot open TUN\/TAP|All .* adapters .* are currently in use|There are no TAP-Windows|Error opening configuration file|Options error/i.test(
            line,
          )
        ) {
          finish(new AppError(`OpenVPN error: ${line}`, 502));
        }
      };

      const onData = (buf: Buffer) =>
        buf.toString().split(/\r?\n/).forEach(handleLine);

      proc.stdout?.on("data", onData);
      proc.stderr?.on("data", onData);

      proc.on("error", (e) =>
        finish(
          new AppError(
            `Failed to start OpenVPN: ${e.message}. Run the backend as Administrator.`,
            500,
          ),
        ),
      );

      proc.on("exit", (code) => {
        this.proc = null;
        if (this.state === "connected") {
          this.state = "disconnected";
          logger.warn(`[vpn] OpenVPN exited (code ${code}).`);
        } else {
          finish(
            new AppError(
              `OpenVPN exited before connecting (code ${code}). Try running as Administrator.`,
              502,
            ),
          );
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
    this.state = "disconnected";
  }
}

export const openVpn = new OpenVpnManager();
