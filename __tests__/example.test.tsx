"use client"

import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import jest from "jest" // Importing jest to fix the undeclared variable error

describe("Button Component", () => {
  it("renders a button with text", () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<Button className="custom-class">Test</Button>)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
  })

  it("handles click events", () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole("button")
    button.click()

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
