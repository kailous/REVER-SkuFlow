# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

Gift management is an independent area with no series relationship. Keep it as its own left-sidebar destination; each gift only has a name and specification (plus system-generated UUID and number).
Gifts follow the same configurable duplicate-data policy as SKUs, products, and series. Gifts match as duplicates when their normalized name and specification are both identical; duplicates are forbidden by default, and when enabled they still require confirmation every time.

Mechanism management is a left-sidebar area parallel to SKU management. It opens at a mechanism-library list (for example, May Day and 618 campaigns). Each library owns an independent mechanism table and numbering sequence beginning at 0001. A mechanism has a system-generated UUID, paragraph-form mechanism copy, and a combination of one or more gifts with quantities; mechanisms can be copied between libraries and the copies remain independent.
Mechanism libraries can also be copied as a whole. A library copy receives a new name and UUID, preserves the original per-library mechanism numbers, and duplicates every mechanism plus its gift quantities as independently editable records.
Within one mechanism library, a mechanism is a duplicate only when both its normalized mechanism copy and its order-independent gift/quantity combination match. The same gift combination with different copy is not a duplicate. Exact duplicates are blocked on save and when copying into another library.

A mechanism library may contain multiple fixed mechanisms. Fixed status belongs to each mechanism, not to the library-creation flow: every mechanism create/edit form includes a `固定机制` switch. Library detail separates fixed and ordinary mechanisms. Every fixed mechanism is automatically additive for every SKU in every activity using that library; users may still select one ordinary mechanism per SKU. Copying a mechanism or whole library preserves whether each mechanism is fixed.

Activity management is a left-sidebar area. Creating an activity requires choosing one mechanism library and creates an activity table that always lists every current SKU. Each SKU may bind one mechanism from the activity's selected library, preview that mechanism's copy and gift combination, and store an independent paragraph-form activity mechanism copy. Activity copy never changes the source mechanism.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable design direction

- Keep the interface minimal and productivity-focused, inspired by Notion's restraint without copying its branding.
- Support light and dark appearance automatically through the operating system preference.
- Prefer whitespace, typography, dividers, and row grouping over cards, decoration, gradients, or heavy shadows.
- Product management functionality takes priority over visual polish; the user plans a manual design pass after the complete demo is working.
- Manage SKU combinations inside the same application through a left-sidebar entry. Each SKU can contain multiple existing products, each with a positive integer quantity.
- Generate SKU names automatically from configurable `系列`、`产品名称`、`规格` fields, defaulting to that order with no separator inside each product name. Join multiple products with ` + ` and only append ` × 数量` when quantity is greater than 1. Keep the field order adjustable in Settings.
- Treat SKUs as duplicates when they contain the same products with the same quantities, regardless of selection order. Mark every duplicate in the list and require a second save confirmation when creating or editing one.
- Duplicate SKU, product, and series creation is disabled by default and enforced in the database. Settings may allow each category independently, but allowed duplicates must still show a warning and require confirmation every time.
- Selling-point copy is paragraph text, not a list. It inherits from series to product to SKU using nullable overrides: products may use their series or store their own paragraph; SKUs may choose one included product (default first) or store direct custom copy. Overrides never mutate their source. SKU price is independent.
