import { Counter, collectDefaultMetrics, Registry } from "prom-client";
import http from "http";
import express from "express";

export class Metrics {
  private register: Registry;
  private metricsApp = express();
  private init = false;

  // this is only necessary since it needs to be called within a When()
  public async asyncInit() {
    if (this.init) {
      return;
    }
    this.init = true;
    const metricsPort = 18888;
    const metricsServer = http
      .createServer(this.metricsApp)
      .listen(metricsPort);

    metricsServer.on("error", (e: { code: string }) => {
      console.log(`error ${e}`);
    });

    metricsServer.on("listening", () => {
      console.log(`Metrics Server listening on port ${metricsPort}`);
    });
    this.metricsApp.get("/metrics", async (req, res) => {
      res.set("Content-Type", "text/plain");
      res.send(await this.getMetrics());
    });
  }
  constructor() {
    this.register = new Registry();
    collectDefaultMetrics({ register: this.register });
  }

  public addThingy(name: string, help: string): Counter<string> {
    return new Counter({
      name: name,
      help: help,
      registers: [this.register],
    });
  }

  public async incThingy(thingy: Counter<string>) {
    await this.asyncInit();
    thingy.inc();
  }

  public getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
