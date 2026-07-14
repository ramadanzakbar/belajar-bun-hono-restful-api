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
          username: "",
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

describe("POST /api/users/login", () => {
  beforeEach(async () => {
    await prismaClient.user.deleteMany({ where: { username: "test" } });
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });

  it("should login successfully", async () => {
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

    const response = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "password",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("success");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
    expect(body.data.token).toBeDefined();
  });

  it("should reject if password is wrong", async () => {
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

    const response = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });

  it("should reject if username not found", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "nonexistent",
          password: "password",
        }),
      })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });

  it("should reject if validation error", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "",
          password: "password",
        }),
      })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });
});
