import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Login from "./Login";
import "@testing-library/jest-dom/vitest";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockMutate = vi.fn();

const mockUseLogin = vi.fn();

vi.mock("../hooks/useLogin", () => ({
  default: (err: Error | null) =>
    mockUseLogin({ mutate: mockMutate, error: err }),
}));

const mockUpdateUser = vi.fn();
vi.mock("@renderer/shared/stores/boundStore", () => ({
  default: (selector: (s: unknown) => unknown) =>
    selector({ updateUser: mockUpdateUser }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe("Login page", () => {
  beforeEach(() => {
    mockUseLogin.mockReturnValue({ mutate: mockMutate, error: null });

    vi.clearAllMocks();
  });

  it("renders username and password fields", () => {
    renderLogin();
    expect(screen.getByLabelText(/user name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the login button", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("renders the register link", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
  });

  it("renders the footer copyright", () => {
    renderLogin();
    expect(screen.getByText(/baligya/i)).toBeInTheDocument();
  });

  it("does NOT show an error alert when there is no error", () => {
    renderLogin();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows validation error when username is too short", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/user name/i), "ab"); // < 4 chars
    await user.type(screen.getByLabelText(/password/i), "validpassword");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(
      await screen.findByText("At least 4 characters"),
    ).toBeInTheDocument();
  });

  it("shows validation when password is short", async () => {
    const user = userEvent.setup();

    renderLogin();

    const userName = screen.getByLabelText(/user name/i);
    const password = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole("button", { name: "Login" });

    // user click
    await user.type(userName, "iamelme");
    await user.type(password, "abc");
    await user.click(submitBtn);

    expect(
      await screen.findByText("At least 6 characters"),
    ).toBeInTheDocument();
  });

  it("shows validation error when submit empty fields", async () => {
    const user = userEvent.setup();
    renderLogin();

    const submitBtn = screen.getByRole("button", { name: "Login" });

    // user click
    await user.click(submitBtn);

    expect(
      await screen.findByText("At least 4 characters"),
    ).toBeInTheDocument();
  });

  it("calls mutate with correct values on valid submission", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/user name/i), "john_doe");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        user_name: "john_doe",
        password: "secret123",
      });
    });
  });

  it("Show error message from useLogin", async () => {
    mockUseLogin.mockReturnValue({
      mock: mockMutate,
      error: new Error("Invalid credentials"),
    });

    renderLogin();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});
