import React from "react";
import renderer, { act } from "react-test-renderer";
import TaskCard from "../TaskCard";

describe("TaskCard Component", () => {
  const mockTask = {
    id: 1,
    title: "Belajar React Native",
    description: "Belajar membuat unit test menggunakan Jest",
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("renders correctly with task data", () => {
    let tree;
    act(() => {
      tree = renderer.create(<TaskCard task={mockTask} onPress={() => {}} />).toJSON();
    });
    
    expect(tree).toMatchSnapshot();
  });
});
