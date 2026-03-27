import { render, screen } from "@testing-library/react";
import Summary from "./Summary";
import { describe, it, expect} from "vitest";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";

function createMockCart(overrides = {}) {
  return {
    id: 1,
    sub_total: 9200,
    discount: 0,
    vatable_sales: 9200 / 1.12,
    vat_amount: 9200 - 9200 / 1.12,
    tax: 12,
    total: 9200,
    items: [
      {
        id: 183,
        quantity: 6,
        cart_id: 1,
        product_id: 44,
        user_id: 3,
        price: 1200,
        cost: 1000,
        name: "Ariel",
        sku: "ARIEL",
        code: 11111,
        product_quantity: 6,
      },
      {
        id: 184,
        quantity: 2,
        cart_id: 1,
        product_id: 30,
        user_id: 3,
        price: 1000,
        cost: 850,
        name: "Sunsilk red",
        sku: "SUNSILK-RED",
        code: 2222,
        product_quantity: 7,
      },
    ],
    ...overrides,
  };
}

function renderSummary(arg?: {}) {
  const data = createMockCart(arg);
  return render(
    <Summary
      data={data}
      onChangeDiscount={(v) => {
        console.log(v);
      }}
    >
      <Summary.NoOfItems />
      <Summary.SubTotal />
      <Summary.Discount />
      <Summary.Tax />
      <Summary.Total />
    </Summary>,
  );
}

describe("Summary", () => {
  it("Check items quantity", () => {
    renderSummary();
    expect(screen.getByTestId("noOfItems").textContent).toBe("8");
  });

  it("Check total after discount", async () => {
    const user = userEvent.setup();
    const value = "10";
    const convertedValue = Number(value) * 100;
    const total = createMockCart().total - convertedValue;
    const mockData = createMockCart({ discount: convertedValue, total });
    renderSummary(mockData);
    await user.type(screen.getByTestId("discount-textfield"), value);

    expect(screen.getByTestId("total").textContent).toBe(
      `${new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(total / 100)}`,
    );
  });

  it("Check sub total", () => {
    renderSummary();
    expect(screen.getByTestId("subTotal").textContent).toBe("₱92.00");
  });
  it("Check total", () => {
    renderSummary();
    expect(screen.getByTestId("total").textContent).toBe("₱92.00");
  });
});
