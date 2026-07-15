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
      }),
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
      }),
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
      }),
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
      }),
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
      }),
    );

    const response = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "password",
        }),
      }),
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
      }),
    );

    const response = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "wrongpassword",
        }),
      }),
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
      }),
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
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });
});

describe("GET /api/users/current", () => {
  beforeEach(async () => {
    await prismaClient.user.deleteMany({ where: { username: "test" } });
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });

  async function registerAndLogin() {
    await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test",
          password: "password",
          name: "test",
        }),
      }),
    );

    const res = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "test", password: "password" }),
      }),
    );

    const body = await res.json();
    return body.data.token as string;
  }

  it("should get current user successfully", async () => {
    const token = await registerAndLogin();

    const response = await app.fetch(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("success");
    expect(body.data.username).toBe("test");
    expect(body.data.name).toBe("test");
    expect(body.data.token).toBeDefined();
  });

  it("should reject if token is invalid", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });

  it("should reject if no Authorization header", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });
});

describe("PATCH /api/users/current", () => {
  beforeEach(async () => {
    await prismaClient.user.deleteMany({ where: { username: "test" } });
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });

  async function registerAndLogin() {
    await app.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "test", password: "password", name: "test" }),
      }),
    );

    const res = await app.fetch(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "test", password: "password" }),
      }),
    );

    const body = await res.json();
    return body.data.token as string;
  }

  it("should update user name successfully", async () => {
    const token = await registerAndLogin();

    const response = await app.fetch(
      new Request("http://localhost/api/users/current", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "updated" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("success");
    expect(body.data.name).toBe("updated");
    expect(body.data.username).toBe("test");
  });

  it("should update password successfully", async () => {
    const token = await registerAndLogin();

    const response = await app.fetch(
      new Request("http://localhost/api/users/current", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: "newpassword" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("success");
  });

  it("should reject if token is invalid", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users/current", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({ name: "updated" }),
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });

  it("should reject if no Authorization header", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/users/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "updated" }),
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.status).toBe("error");
  });
});
