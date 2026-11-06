/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EyeIcon, EyeOffIcon } from "./icons";

describe("EyeIcon", () => {
  it("merender SVG dekoratif berukuran 18 secara bawaan", () => {
    const { container } = render(<EyeIcon />);
    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "18");
    expect(svg).toHaveAttribute("height", "18");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("fill", "none");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("mengikuti prop size", () => {
    const { container } = render(<EyeIcon size={24} />);

    expect(container.querySelector("svg")).toHaveAttribute("width", "24");
    expect(container.querySelector("svg")).toHaveAttribute("height", "24");
  });
});

describe("EyeOffIcon", () => {
  it("merender SVG dekoratif dengan lintasan coretan", () => {
    const { container } = render(<EyeOffIcon size={20} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
