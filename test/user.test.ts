import { describe, it, expect, afterAll, beforeEach } from "bun:test";
import app from "../src";
import { prismaClient } from "../src/applications/database";

describe("POST /api/users", () => {
  beforeEach(async () => {
    await prismaClient.user.deleteMany({ where: { username: "test" } });
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({ where: { username: "test" } });
    await prismaClient.$disconnect();
  });

  it("should register a user successfully", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "password",
          name: "test",
        }),
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("success");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
    expect(body.data.token).toBeUndefined();
  });

  it("should reject if username already exists", async () => {
    // register first
    await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "password",
          name: "test",
        }),
      })
    );

    // register again with same username
    const response = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "password",
          name: "test",
        }),
      })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });

  it("should reject if validation error", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "", // invalid: min(1)
          password: "password",
          name: "test",
        }),
      })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });
});
