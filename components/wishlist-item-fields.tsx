import type { WishlistItem } from "@/lib/types";

export function WishlistItemFields({ item }: { item?: WishlistItem }) {
  return (
    <>
      <div>
        <label className="label" htmlFor={`title-${item?.id ?? "new"}`}>
          Gift idea <span className="text-holly-600">*</span>
        </label>
        <input
          id={`title-${item?.id ?? "new"}`}
          name="title"
          required
          maxLength={160}
          defaultValue={item?.title}
          placeholder="e.g. A cozy navy scarf"
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor={`details-${item?.id ?? "new"}`}>
          Details
        </label>
        <textarea
          id={`details-${item?.id ?? "new"}`}
          name="details"
          rows={2}
          maxLength={800}
          defaultValue={item?.details ?? ""}
          placeholder="Style, material, the exact edition… anything that helps."
          className="field resize-y"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`price-${item?.id ?? "new"}`}>
            Approx. price
          </label>
          <input
            id={`price-${item?.id ?? "new"}`}
            name="price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={item?.price ?? undefined}
            placeholder="Optional"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor={`priority-${item?.id ?? "new"}`}>
            How much do you want it?
          </label>
          <select
            id={`priority-${item?.id ?? "new"}`}
            name="priority"
            defaultValue={String(item?.priority ?? 2)}
            className="field"
          >
            <option value="1">Top of my list</option>
            <option value="2">Would love it</option>
            <option value="3">Nice to have</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`color-${item?.id ?? "new"}`}>
            Colour
          </label>
          <input
            id={`color-${item?.id ?? "new"}`}
            name="color"
            maxLength={80}
            defaultValue={item?.color ?? ""}
            placeholder="e.g. forest green"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor={`size-${item?.id ?? "new"}`}>
            Size
          </label>
          <input
            id={`size-${item?.id ?? "new"}`}
            name="size"
            maxLength={80}
            defaultValue={item?.size ?? ""}
            placeholder="e.g. M, 38, one size"
            className="field"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`url-${item?.id ?? "new"}`}>
          Shop link
        </label>
        <input
          id={`url-${item?.id ?? "new"}`}
          name="product_url"
          type="url"
          maxLength={800}
          defaultValue={item?.product_url ?? ""}
          placeholder="https://…"
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor={`notes-${item?.id ?? "new"}`}>
          Notes / things to avoid
        </label>
        <textarea
          id={`notes-${item?.id ?? "new"}`}
          name="notes"
          rows={2}
          maxLength={800}
          defaultValue={item?.notes ?? ""}
          placeholder="Allergic to wool? Already own it in black? Add it here."
          className="field resize-y"
        />
      </div>
    </>
  );
}
