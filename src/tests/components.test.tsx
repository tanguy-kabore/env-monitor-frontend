/**
 * Component unit tests — Card, LoadingSpinner.
 */
import { it, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";

// Using named imports ensures we pick up the correct export shape
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";

// ── Card ──────────────────────────────────────────────────────────────────────

describe("Card", () => {
  it("renders title", () => {
    render(<Card title="Météo">content</Card>);
    expect(screen.getByText("Météo")).toBeTruthy();
  });

  it("renders children", () => {
    render(<Card title="T">child content</Card>);
    expect(screen.getByText("child content")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    render(<Card title="T" subtitle="sous-titre">content</Card>);
    expect(screen.getByText("sous-titre")).toBeTruthy();
  });

  it("renders headerAction when provided", () => {
    render(
      <Card title="T" headerAction={<button>Actualiser</button>}>
        content
      </Card>
    );
    expect(screen.getByText("Actualiser")).toBeTruthy();
  });

  it("renders without title — no header", () => {
    const { container } = render(<Card>just children</Card>);
    expect(screen.getByText("just children")).toBeTruthy();
    // No border-b div rendered when title/icon absent
    const borderDivs = container.querySelectorAll(".border-b");
    expect(borderDivs.length).toBe(0);
  });
});

// ── LoadingSpinner ────────────────────────────────────────────────────────────

describe("LoadingSpinner", () => {
  it("renders default message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Chargement...")).toBeTruthy();
  });

  it("renders custom message", () => {
    render(<LoadingSpinner message="Veuillez patienter..." />);
    expect(screen.getByText("Veuillez patienter...")).toBeTruthy();
  });

  it("renders spinner element", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  });
});
