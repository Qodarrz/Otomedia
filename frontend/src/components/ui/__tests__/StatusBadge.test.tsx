import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import StatusBadge from "../StatusBadge";

describe("StatusBadge Component", () => {
  it("renders correctly with pending status", async () => {
    await render(<StatusBadge status="pending" />);
    expect(screen.getByText("pending")).toBeTruthy();
  });

  it("renders correctly with in_progress status and capitalizes text", async () => {
    await render(<StatusBadge status="in_progress" />);
    // Status text replaces _ with space
    expect(screen.getByText("in progress")).toBeTruthy();
  });

  it("renders 'All' when status is empty string", async () => {
    await render(<StatusBadge status="" />);
    expect(screen.getByText("All")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPressMock = jest.fn();
    await render(<StatusBadge status="completed" onPress={onPressMock} />);

    fireEvent.press(screen.getByText("completed"));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
